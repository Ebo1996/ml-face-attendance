"""
ml/evaluation/evaluate.py
==========================
Phase 21 — ML Evaluation

Evaluates the face recognition pipeline using one of two data sources:

  1. Real images  (--image-dir)
     -----------
     Reads a directory of labelled face images.
     Expected layout (one subfolder per identity):

         dataset/
           alice/
             img_001.jpg
             img_002.jpg
           bob/
             img_001.jpg
             img_002.jpg

     Runs the actual InsightFace buffalo_l pipeline (SCRFD + ArcFace) on
     every image to extract 512-d embeddings, then builds genuine and
     impostor pairs from those embeddings.

  2. Synthetic embeddings  (default, no --image-dir)
     --------------------
     Generates random Gaussian embeddings to simulate identities.
     Useful for CI / smoke-testing without a labelled dataset.
     Clearly documented as synthetic in the output report.

Metrics reported
----------------
  TAR   True Accept Rate   (fraction of genuine pairs matched)
  FAR   False Accept Rate  (fraction of impostor pairs matched)
  FRR   False Reject Rate
  TRR   True Reject Rate
  Precision / Recall / F1
  AUC   Area Under the ROC Curve
  EER   Equal Error Rate (FAR == FRR operating point)
  Recognition latency  (ms, real pipeline if model available)

Usage
-----
  # Synthetic (always works, no dataset needed)
  python ml/evaluation/evaluate.py

  # Real images from a labelled directory
  python ml/evaluation/evaluate.py --image-dir path/to/dataset/

  # Tune threshold and write JSON report
  python ml/evaluation/evaluate.py --threshold 0.65 --output report.json

  # Quick smoke test
  python ml/evaluation/evaluate.py --n-genuine 20 --n-impostor 40

Requirements
-----------
  numpy, scikit-learn     (always needed)
  opencv-python           (needed for --image-dir)
  insightface, onnxruntime (needed for --image-dir)
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import warnings
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np

# Allow running from repo root without installing as a package
_HERE    = os.path.dirname(os.path.abspath(__file__))
_BACKEND = os.path.abspath(os.path.join(_HERE, '..', '..'))
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

warnings.filterwarnings('ignore')


# ── Data structures ───────────────────────────────────────────────────

@dataclass
class EvaluationConfig:
    threshold:              float         = 0.60
    n_genuine_pairs:        int           = 200
    n_impostor_pairs:       int           = 400
    embedding_dim:          int           = 512
    n_synthetic_identities: int           = 50
    image_dir:              Optional[str] = None   # path to real-image dataset
    output_path:            Optional[str] = None
    verbose:                bool          = True
    random_seed:            int           = 42
    max_images_per_identity: int          = 10     # cap to keep memory bounded


@dataclass
class PairResult:
    similarity:      float
    is_genuine:      bool
    predicted_match: bool


@dataclass
class LatencyResult:
    detection_ms:  float
    embedding_ms:  float
    matching_ms:   float
    total_ms:      float


@dataclass
class EvaluationReport:
    timestamp:        str
    config:           dict
    # Binary classification metrics
    tar:              float
    far:              float
    trr:              float
    frr:              float
    precision:        float
    recall:           float
    f1:               float
    auc:              float
    eer:              float
    eer_threshold:    float
    # Per-threshold curve data
    thresholds:       List[float] = field(default_factory=list)
    tars_curve:       List[float] = field(default_factory=list)
    fars_curve:       List[float] = field(default_factory=list)
    # Latency
    avg_detection_ms: float  = 0.0
    avg_embedding_ms: float  = 0.0
    avg_matching_ms:  float  = 0.0
    avg_total_ms:     float  = 0.0
    p95_total_ms:     float  = 0.0
    # Pair counts
    n_genuine:        int    = 0
    n_impostor:       int    = 0
    n_tp:             int    = 0
    n_fp:             int    = 0
    n_tn:             int    = 0
    n_fn:             int    = 0
    # Data source
    data_source:      str    = 'synthetic'
    n_identities:     int    = 0
    n_images:         int    = 0
    notes:            List[str] = field(default_factory=list)


# ── Similarity helper ─────────────────────────────────────────────────

def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity normalised to [0, 1]."""
    from sklearn.metrics.pairwise import cosine_similarity as sk_cos
    raw = float(sk_cos(a.reshape(1, -1), b.reshape(1, -1))[0, 0])
    return (raw + 1.0) / 2.0


# ── Real-image data source ────────────────────────────────────────────

def _load_real_embeddings(
    cfg: EvaluationConfig,
) -> Tuple[Dict[str, List[np.ndarray]], List[LatencyResult]]:
    """
    Walk cfg.image_dir, run InsightFace on every image, return
    {identity_label: [embedding, ...]} and per-image latency records.

    Requires: opencv-python, insightface, onnxruntime
    """
    try:
        import cv2
        from insightface.app import FaceAnalysis
    except ImportError as exc:
        raise SystemExit(
            f"[evaluate.py] Real-image mode requires opencv-python, insightface, "
            f"and onnxruntime.\n  pip install opencv-python insightface onnxruntime\n"
            f"  Original error: {exc}"
        )

    if cfg.verbose:
        print("  Loading InsightFace buffalo_l model…")

    app = FaceAnalysis(
        name='buffalo_l',
        providers=['CPUExecutionProvider'],
    )
    app.prepare(ctx_id=0, det_size=(640, 640))

    dataset_root = Path(cfg.image_dir)  # type: ignore[arg-type]
    if not dataset_root.is_dir():
        raise SystemExit(f"[evaluate.py] --image-dir '{cfg.image_dir}' is not a directory.")

    identity_dirs = sorted(
        p for p in dataset_root.iterdir() if p.is_dir()
    )
    if not identity_dirs:
        raise SystemExit(
            f"[evaluate.py] No sub-directories found in '{cfg.image_dir}'.\n"
            f"  Expected layout: dataset/<identity_name>/<image_files>"
        )

    IMAGE_EXTS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
    embeddings: Dict[str, List[np.ndarray]] = {}
    latency_records: List[LatencyResult] = []
    total_images = 0
    skipped = 0

    for identity_dir in identity_dirs:
        label    = identity_dir.name
        img_paths = sorted(
            p for p in identity_dir.iterdir()
            if p.suffix.lower() in IMAGE_EXTS
        )[: cfg.max_images_per_identity]

        if not img_paths:
            continue

        embeddings[label] = []

        for img_path in img_paths:
            t0  = time.perf_counter()
            img = cv2.imread(str(img_path))
            if img is None:
                skipped += 1
                continue

            t1    = time.perf_counter()
            faces = app.get(img)
            det_ms = (time.perf_counter() - t1) * 1000

            if not faces:
                skipped += 1
                if cfg.verbose:
                    print(f"    [skip] No face detected: {img_path.name}")
                continue

            # Use the face with the highest detection score
            face    = max(faces, key=lambda f: f.det_score)
            emb     = face.normed_embedding.astype(np.float32)
            emb_ms  = (time.perf_counter() - t1) * 1000 - det_ms
            total_ms = (time.perf_counter() - t0) * 1000

            embeddings[label].append(emb)
            latency_records.append(LatencyResult(det_ms, emb_ms, 0.0, total_ms))
            total_images += 1

        if not embeddings[label]:
            del embeddings[label]

    if cfg.verbose:
        print(
            f"  Loaded {total_images} embeddings across "
            f"{len(embeddings)} identities  ({skipped} images skipped — no face detected)"
        )

    if len(embeddings) < 2:
        raise SystemExit(
            "[evaluate.py] Need at least 2 identities with valid face images. "
            f"Only {len(embeddings)} found after filtering."
        )

    return embeddings, latency_records


def _build_real_pairs(
    embeddings: Dict[str, List[np.ndarray]],
    cfg: EvaluationConfig,
) -> Tuple[List[PairResult], np.ndarray, np.ndarray]:
    """Build genuine and impostor pairs from real embeddings."""
    rng      = np.random.default_rng(cfg.random_seed)
    labels   = list(embeddings.keys())
    pairs: List[PairResult]   = []
    genuine_sims: List[float] = []
    impostor_sims: List[float] = []

    # ── Genuine pairs ─────────────────────────────────────────────────
    for label, embs in embeddings.items():
        if len(embs) < 2:
            continue
        idxs = list(range(len(embs)))
        # All unique pairs for this identity
        for i in range(len(idxs)):
            for j in range(i + 1, len(idxs)):
                sim = _cosine_similarity(embs[i], embs[j])
                genuine_sims.append(sim)
                pairs.append(PairResult(
                    similarity=sim,
                    is_genuine=True,
                    predicted_match=sim >= cfg.threshold,
                ))
                if len(genuine_sims) >= cfg.n_genuine_pairs:
                    break
            if len(genuine_sims) >= cfg.n_genuine_pairs:
                break
        if len(genuine_sims) >= cfg.n_genuine_pairs:
            break

    # ── Impostor pairs ────────────────────────────────────────────────
    n_impostor = 0
    label_arr  = np.array(labels)
    while n_impostor < cfg.n_impostor_pairs:
        i, j = rng.choice(len(label_arr), size=2, replace=False)
        la, lb = label_arr[i], label_arr[j]
        if la == lb:
            continue
        ea = embeddings[la][int(rng.integers(len(embeddings[la])))]
        eb = embeddings[lb][int(rng.integers(len(embeddings[lb])))]
        sim = _cosine_similarity(ea, eb)
        impostor_sims.append(sim)
        pairs.append(PairResult(
            similarity=sim,
            is_genuine=False,
            predicted_match=sim >= cfg.threshold,
        ))
        n_impostor += 1

    return pairs, np.array(genuine_sims), np.array(impostor_sims)


# ── Synthetic data source (fallback / CI) ─────────────────────────────

def _make_identity_embedding(rng: np.random.Generator) -> np.ndarray:
    v = rng.standard_normal(512).astype(np.float32)
    return v / np.linalg.norm(v)


def _perturb(base: np.ndarray, noise: float, rng: np.random.Generator) -> np.ndarray:
    v = base + rng.standard_normal(512).astype(np.float32) * noise
    return v / np.linalg.norm(v)


def _generate_synthetic_pairs(
    cfg: EvaluationConfig,
) -> Tuple[List[PairResult], np.ndarray, np.ndarray]:
    rng        = np.random.default_rng(cfg.random_seed)
    identities = [_make_identity_embedding(rng) for _ in range(cfg.n_synthetic_identities)]
    pairs: List[PairResult]   = []
    genuine_sims: List[float] = []
    impostor_sims: List[float] = []

    # Genuine pairs
    n_ids  = len(identities)
    per_id = max(1, cfg.n_genuine_pairs // n_ids)
    for base in identities:
        for _ in range(per_id):
            a   = _perturb(base, noise=0.08, rng=rng)
            b   = _perturb(base, noise=0.08, rng=rng)
            sim = _cosine_similarity(a, b)
            genuine_sims.append(sim)
            pairs.append(PairResult(sim, True, sim >= cfg.threshold))
            if len(genuine_sims) >= cfg.n_genuine_pairs:
                break
        if len(genuine_sims) >= cfg.n_genuine_pairs:
            break

    # Impostor pairs
    indices = np.arange(n_ids)
    n_imp   = 0
    while n_imp < cfg.n_impostor_pairs:
        i, j = rng.choice(indices, size=2, replace=False)
        if i == j:
            continue
        a   = _perturb(identities[i], noise=0.06, rng=rng)
        b   = _perturb(identities[j], noise=0.06, rng=rng)
        sim = _cosine_similarity(a, b)
        impostor_sims.append(sim)
        pairs.append(PairResult(sim, False, sim >= cfg.threshold))
        n_imp += 1

    return pairs, np.array(genuine_sims), np.array(impostor_sims)


# ── Metric computation ────────────────────────────────────────────────

def _compute_metrics_at_threshold(pairs: List[PairResult], threshold: float) -> dict:
    tp = fp = tn = fn = 0
    for p in pairs:
        predicted = p.similarity >= threshold
        if   p.is_genuine and     predicted: tp += 1
        elif not p.is_genuine and predicted: fp += 1
        elif not p.is_genuine:               tn += 1
        else:                                fn += 1

    n_g = sum(1 for p in pairs if p.is_genuine)
    n_i = sum(1 for p in pairs if not p.is_genuine)

    tar = tp / n_g if n_g else 0.0
    far = fp / n_i if n_i else 0.0
    frr = fn / n_g if n_g else 0.0
    trr = tn / n_i if n_i else 0.0
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall    = tar
    f1        = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0

    return dict(tar=tar, far=far, frr=frr, trr=trr,
                precision=precision, recall=recall, f1=f1,
                tp=tp, fp=fp, tn=tn, fn=fn)


def _compute_auc_eer(
    pairs: List[PairResult],
) -> Tuple[float, float, float, List[float], List[float], List[float]]:
    thresholds = np.linspace(0.0, 1.0, 201).tolist()
    tars, fars = [], []
    for t in thresholds:
        m = _compute_metrics_at_threshold(pairs, t)
        tars.append(m['tar'])
        fars.append(m['far'])

    # AUC (numpy ≥2.0 uses trapezoid, earlier uses trapz)
    sorted_pts  = sorted(zip(fars, tars))
    fpr_sorted  = [x[0] for x in sorted_pts]
    tpr_sorted  = [x[1] for x in sorted_pts]
    _trapz      = getattr(np, 'trapezoid', None) or np.trapz
    auc         = abs(float(_trapz(tpr_sorted, fpr_sorted)))

    # EER
    eer, eer_t, min_diff = 0.5, 0.5, float('inf')
    for i, t in enumerate(thresholds):
        frr_i = 1.0 - tars[i]
        diff  = abs(fars[i] - frr_i)
        if diff < min_diff:
            min_diff = diff
            eer      = (fars[i] + frr_i) / 2
            eer_t    = t

    return auc, eer, eer_t, thresholds, tars, fars


# ── Latency benchmarks ────────────────────────────────────────────────

def _benchmark_latency_real(cfg: EvaluationConfig, n_samples: int = 30) -> List[LatencyResult]:
    """
    Benchmark the real InsightFace pipeline on synthetic random images.
    Falls back to the fast numpy benchmark if InsightFace is unavailable.
    """
    try:
        import cv2
        from insightface.app import FaceAnalysis
    except ImportError:
        return _benchmark_latency_synthetic(cfg, n_samples)

    rng = np.random.default_rng(cfg.random_seed)
    app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
    app.prepare(ctx_id=0, det_size=(640, 640))
    results: List[LatencyResult] = []

    # Use a 640×480 test image with a simple gradient so SCRFD can fire
    for _ in range(n_samples):
        t0  = time.perf_counter()
        img = rng.integers(100, 200, (480, 640, 3), dtype=np.uint8)
        t1  = time.perf_counter()
        _   = app.get(img)
        det_ms = (time.perf_counter() - t1) * 1000

        # Matching: cosine against 100 synthetic gallery embeddings
        t2      = time.perf_counter()
        gallery = rng.standard_normal((100, 512)).astype(np.float32)
        gallery /= np.linalg.norm(gallery, axis=1, keepdims=True)
        query   = rng.standard_normal(512).astype(np.float32)
        query  /= np.linalg.norm(query)
        from sklearn.metrics.pairwise import cosine_similarity as sk_cos
        _ = sk_cos(query.reshape(1, -1), gallery)
        match_ms  = (time.perf_counter() - t2) * 1000
        total_ms  = (time.perf_counter() - t0) * 1000

        results.append(LatencyResult(det_ms, 0.0, match_ms, total_ms))

    return results


def _benchmark_latency_synthetic(cfg: EvaluationConfig, n_samples: int = 50) -> List[LatencyResult]:
    """Fast numpy-only latency benchmark (no model required)."""
    from sklearn.metrics.pairwise import cosine_similarity as sk_cos
    rng     = np.random.default_rng(cfg.random_seed)
    results = []

    for _ in range(n_samples):
        t0  = time.perf_counter()
        _   = rng.integers(0, 256, (480, 640, 3), dtype=np.uint8)
        det_ms = (time.perf_counter() - t0) * 1000

        t1  = time.perf_counter()
        emb = rng.standard_normal(cfg.embedding_dim).astype(np.float32)
        emb /= np.linalg.norm(emb)
        emb_ms = (time.perf_counter() - t1) * 1000

        t2      = time.perf_counter()
        gallery = rng.standard_normal((100, cfg.embedding_dim)).astype(np.float32)
        gallery /= np.linalg.norm(gallery, axis=1, keepdims=True)
        _        = sk_cos(emb.reshape(1, -1), gallery)
        match_ms  = (time.perf_counter() - t2) * 1000
        total_ms  = det_ms + emb_ms + match_ms

        results.append(LatencyResult(det_ms, emb_ms, match_ms, total_ms))

    return results


# ── Main evaluation ───────────────────────────────────────────────────

def run_evaluation(cfg: EvaluationConfig) -> EvaluationReport:
    if cfg.verbose:
        print("=" * 62)
        print("  Face Recognition System — ML Evaluation  (Phase 21)")
        print("=" * 62)
        print(f"  Data source   : {'real images (' + cfg.image_dir + ')' if cfg.image_dir else 'synthetic embeddings'}")
        print(f"  Threshold     : {cfg.threshold}")
        print(f"  Genuine pairs : {cfg.n_genuine_pairs}")
        print(f"  Impostor pairs: {cfg.n_impostor_pairs}")
        print()

    latency_from_load: List[LatencyResult] = []
    n_identities = cfg.n_synthetic_identities
    n_images     = 0
    data_source  = 'synthetic'

    # 1. Generate / load test pairs ─────────────────────────────────
    if cfg.image_dir:
        if cfg.verbose:
            print("[1/4] Loading real face images and extracting embeddings…")
        real_embeddings, latency_from_load = _load_real_embeddings(cfg)
        pairs, genuine_sims, impostor_sims = _build_real_pairs(real_embeddings, cfg)
        n_identities = len(real_embeddings)
        n_images     = sum(len(v) for v in real_embeddings.values())
        data_source  = f'real_images:{cfg.image_dir}'
    else:
        if cfg.verbose:
            print("[1/4] Generating synthetic test pairs…")
        pairs, genuine_sims, impostor_sims = _generate_synthetic_pairs(cfg)

    if cfg.verbose:
        print(
            f"      {len(pairs)} pairs  "
            f"({sum(p.is_genuine for p in pairs)} genuine, "
            f"{sum(not p.is_genuine for p in pairs)} impostor)"
        )
        if len(genuine_sims):
            print(
                f"      Genuine  sim: mean={genuine_sims.mean():.4f} "
                f"std={genuine_sims.std():.4f} "
                f"min={genuine_sims.min():.4f} max={genuine_sims.max():.4f}"
            )
        if len(impostor_sims):
            print(
                f"      Impostor sim: mean={impostor_sims.mean():.4f} "
                f"std={impostor_sims.std():.4f} "
                f"min={impostor_sims.min():.4f} max={impostor_sims.max():.4f}"
            )

    # 2. Metrics at configured threshold ────────────────────────────
    if cfg.verbose:
        print(f"\n[2/4] Computing metrics at threshold={cfg.threshold}…")
    m = _compute_metrics_at_threshold(pairs, cfg.threshold)
    if cfg.verbose:
        print(f"      TAR : {m['tar']:.4f}  (TP={m['tp']}, FN={m['fn']})")
        print(f"      FAR : {m['far']:.4f}  (FP={m['fp']}, TN={m['tn']})")
        print(f"      FRR : {m['frr']:.4f}")
        print(f"      F1  : {m['f1']:.4f}")

    # 3. AUC + EER ──────────────────────────────────────────────────
    if cfg.verbose:
        print("\n[3/4] Computing AUC and EER…")
    auc, eer, eer_t, thresholds, tars_c, fars_c = _compute_auc_eer(pairs)
    if cfg.verbose:
        print(f"      AUC : {auc:.4f}")
        print(f"      EER : {eer:.4f}  (threshold={eer_t:.2f})")

    # 4. Latency ────────────────────────────────────────────────────
    if cfg.verbose:
        print("\n[4/4] Benchmarking recognition latency…")
    if cfg.image_dir and latency_from_load:
        lat = latency_from_load
    elif cfg.image_dir:
        lat = _benchmark_latency_real(cfg, n_samples=30)
    else:
        lat = _benchmark_latency_synthetic(cfg, n_samples=50)

    totals    = [r.total_ms for r in lat]
    det_avg   = np.mean([r.detection_ms  for r in lat])
    emb_avg   = np.mean([r.embedding_ms  for r in lat])
    match_avg = np.mean([r.matching_ms   for r in lat])
    total_avg = np.mean(totals)
    p95       = float(np.percentile(totals, 95))

    if cfg.verbose:
        print(f"      Avg detection : {det_avg:.2f} ms")
        print(f"      Avg embedding : {emb_avg:.2f} ms")
        print(f"      Avg matching  : {match_avg:.2f} ms")
        print(f"      Avg total     : {total_avg:.2f} ms  (P95: {p95:.2f} ms)")

    # Build notes based on data source
    if cfg.image_dir:
        notes = [
            f"Evaluated on real face images from: {cfg.image_dir}",
            f"Identities: {n_identities}, total images processed: {n_images}",
            "InsightFace buffalo_l pipeline used: SCRFD detection + ArcFace embedding.",
            "Embeddings are 512-d L2-normalised vectors from the pretrained ResNet-50 ArcFace model.",
            "Cosine similarity normalised to [0,1]: (cos+1)/2.",
            f"Recognition threshold: {cfg.threshold}  "
            f"(configurable via FACE_VERIFICATION_THRESHOLD env var).",
            "For production use, evaluate on a held-out test set disjoint from enrolled employees.",
        ]
    else:
        notes = [
            "Evaluated on SYNTHETIC embeddings (no real images used).",
            "Genuine pairs: same-identity Gaussian-perturbed embeddings (noise=0.08).",
            "Impostor pairs: embeddings from distinct synthetic identities.",
            "Latency figures reflect cosine-similarity only; "
            "InsightFace inference adds ~50–150 ms on CPU.",
            "To evaluate on real images, re-run with: "
            "  python ml/evaluation/evaluate.py --image-dir path/to/dataset/",
            "Expected dataset layout: dataset/<identity_name>/<image_files>",
        ]

    report = EvaluationReport(
        timestamp        = datetime.utcnow().isoformat() + "Z",
        config           = asdict(cfg),  # type: ignore[call-overload]
        tar              = m['tar'],
        far              = m['far'],
        trr              = m['trr'],
        frr              = m['frr'],
        precision        = m['precision'],
        recall           = m['recall'],
        f1               = m['f1'],
        auc              = auc,
        eer              = eer,
        eer_threshold    = eer_t,
        thresholds       = thresholds,
        tars_curve       = tars_c,
        fars_curve       = fars_c,
        avg_detection_ms = round(det_avg,   2),
        avg_embedding_ms = round(emb_avg,   2),
        avg_matching_ms  = round(match_avg, 2),
        avg_total_ms     = round(total_avg, 2),
        p95_total_ms     = round(p95,       2),
        n_genuine        = sum(p.is_genuine     for p in pairs),
        n_impostor       = sum(not p.is_genuine for p in pairs),
        n_tp             = m['tp'],
        n_fp             = m['fp'],
        n_tn             = m['tn'],
        n_fn             = m['fn'],
        data_source      = data_source,
        n_identities     = n_identities,
        n_images         = n_images,
        notes            = notes,
    )

    if cfg.verbose:
        print("\n" + "=" * 62)
        print(f"  SUMMARY  (threshold={cfg.threshold})")
        print("=" * 62)
        print(f"  Data source : {data_source}")
        print(f"  TAR         : {report.tar:.2%}")
        print(f"  FAR         : {report.far:.2%}")
        print(f"  F1          : {report.f1:.4f}")
        print(f"  AUC         : {report.auc:.4f}")
        print(f"  EER         : {report.eer:.2%}  @ threshold {report.eer_threshold:.2f}")
        print(f"  Avg latency : {report.avg_total_ms:.1f} ms  (P95: {report.p95_total_ms:.1f} ms)")
        print("=" * 62)

    return report


# ── CLI ───────────────────────────────────────────────────────────────

def _parse_args() -> EvaluationConfig:
    p = argparse.ArgumentParser(
        description="Phase 21 — ML Evaluation for the Face Recognition Attendance System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Synthetic (no dataset needed, always works)
  python ml/evaluation/evaluate.py

  # Real images — one subfolder per identity
  python ml/evaluation/evaluate.py --image-dir ./test_faces/

  # Custom threshold
  python ml/evaluation/evaluate.py --threshold 0.65 --output my_report.json
        """,
    )
    p.add_argument('--threshold',      type=float, default=0.60,
                   help='Recognition threshold (default 0.60)')
    p.add_argument('--n-genuine',      type=int,   default=200,
                   help='Max genuine (same-person) test pairs')
    p.add_argument('--n-impostor',     type=int,   default=400,
                   help='Max impostor (different-person) test pairs')
    p.add_argument('--n-identities',   type=int,   default=50,
                   help='Synthetic identities (ignored when --image-dir is set)')
    p.add_argument('--image-dir',      type=str,   default=None,
                   help='Path to labelled face image dataset (real-image mode)')
    p.add_argument('--max-per-id',     type=int,   default=10,
                   help='Max images per identity in real-image mode (default 10)')
    p.add_argument('--output',         type=str,   default=None,
                   help='Path to write JSON report (default: evaluation_report.json)')
    p.add_argument('--seed',           type=int,   default=42)
    p.add_argument('--quiet',          action='store_true',
                   help='Suppress progress output')
    args = p.parse_args()

    return EvaluationConfig(
        threshold               = args.threshold,
        n_genuine_pairs         = args.n_genuine,
        n_impostor_pairs        = args.n_impostor,
        n_synthetic_identities  = args.n_identities,
        image_dir               = args.image_dir,
        max_images_per_identity = args.max_per_id,
        output_path             = args.output,
        verbose                 = not args.quiet,
        random_seed             = args.seed,
    )


def main() -> EvaluationReport:
    cfg    = _parse_args()
    report = run_evaluation(cfg)

    out_path = cfg.output_path or os.path.join(_HERE, 'evaluation_report.json')
    d = asdict(report)  # type: ignore[call-overload]
    d['thresholds'] = [round(x, 4) for x in d['thresholds']]
    d['tars_curve'] = [round(x, 4) for x in d['tars_curve']]
    d['fars_curve'] = [round(x, 4) for x in d['fars_curve']]

    with open(out_path, 'w') as f:
        json.dump(d, f, indent=2)

    if cfg.verbose:
        print(f"\n  Report saved → {out_path}")

    return report


if __name__ == '__main__':
    main()
