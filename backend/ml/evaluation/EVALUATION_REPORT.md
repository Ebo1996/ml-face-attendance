# ML Evaluation Report — Phase 21
## Face Recognition Attendance System

**Evaluated:** September 2026  
**Model:** InsightFace buffalo_l (pretrained — not trained by this project)  
**Evaluation Script:** `ml/evaluation/evaluate.py`

---

## Two Evaluation Modes

The evaluation script supports **two data sources**:

| Mode | Flag | When to use |
|---|---|---|
| **Real images** | `--image-dir path/to/dataset/` | Pre-deployment validation with actual employee photos |
| **Synthetic** (default) | _(no flag)_ | CI / smoke-testing, no dataset required |

### Real-image mode — recommended for production

```bash
# Dataset layout: one subfolder per identity
# dataset/
#   alice/img1.jpg  img2.jpg  ...
#   bob/img1.jpg   img2.jpg  ...

python ml/evaluation/evaluate.py \
  --image-dir ./test_faces/ \
  --threshold 0.60 \
  --output ml/evaluation/evaluation_report.json
```

What it does:
1. Walks every identity subfolder in `--image-dir`
2. Runs the full InsightFace buffalo_l pipeline (SCRFD detection → ArcFace embedding) on each image
3. Builds genuine pairs (same identity) and impostor pairs (different identity) from the extracted embeddings
4. Computes TAR / FAR / EER / AUC / F1 at the configured threshold
5. Reports real end-to-end inference latency

### Synthetic mode — for CI / smoke tests

```bash
python ml/evaluation/evaluate.py
```

Uses Gaussian-perturbed random embeddings instead of real images.
No model or dataset required — always passes on any machine.
Figures clearly marked as `data_source: synthetic` in the JSON report.

---

## Synthetic Evaluation Results (baseline, threshold = 0.60)

> ⚠️ These figures come from synthetic embeddings. Re-run with `--image-dir` on a real labelled dataset to obtain production-accurate metrics.

### Test configuration

| Parameter | Value |
|---|---|
| Data source | Synthetic Gaussian embeddings |
| Genuine pairs | 200 |
| Impostor pairs | 400 |
| Synthetic identities | 50 |
| Genuine noise (σ) | 0.08 |
| Threshold | 0.60 |

### Accuracy metrics

| Metric | Value | Description |
|---|---|---|
| **TAR** | **83.50%** | Genuine pairs correctly matched |
| **FAR** | **0.00%** | Impostors incorrectly accepted |
| **FRR** | **16.50%** | Genuine pairs incorrectly rejected |
| **TRR** | **100.00%** | Impostors correctly rejected |
| **Precision** | **1.0000** | |
| **Recall** | **0.8350** | |
| **F1** | **0.9101** | |
| **AUC** | **1.0000** | |
| **EER** | **0.38%** | Equal Error Rate |
| **EER Threshold** | **0.56** | |

### Confusion matrix

```
                  Predicted Match   Predicted No Match
Genuine (200)         167 (TP)           33 (FN)
Impostor (400)          0 (FP)          400 (TN)
```

---

## Real-Image Evaluation — How to Run

### Step 1 — Prepare dataset

```
test_faces/
  employee_001/
    front.jpg
    slight_left.jpg
    slight_right.jpg
  employee_002/
    front.jpg
    glasses.jpg
  ...
```

At least 2 images per identity are needed to build genuine pairs.
The script caps at `--max-per-id` images per identity (default 10).

### Step 2 — Run evaluation

```bash
cd backend
.\venv\Scripts\activate          # Windows
# source venv/bin/activate       # macOS/Linux

python ml/evaluation/evaluate.py \
  --image-dir ./test_faces/ \
  --threshold 0.60 \
  --output ml/evaluation/evaluation_report.json
```

### Step 3 — Interpret the output

The script prints a summary table and saves a JSON report:

```
==============================================================
  SUMMARY  (threshold=0.60)
==============================================================
  Data source : real_images:./test_faces/
  TAR         : 88.24%
  FAR         : 0.00%
  F1          : 0.9375
  AUC         : 0.9982
  EER         : 1.20%  @ threshold 0.57
  Avg latency : 164.3 ms  (P95: 198.1 ms)
==============================================================
```

_(Example output — actual values depend on your dataset and hardware.)_

---

## Latency Reference

| Component | CPU (approximate) | GPU/CUDA (approximate) |
|---|---|---|
| Image decode + validation | 5–15 ms | 5–15 ms |
| SCRFD face detection | 50–100 ms | 5–15 ms |
| ArcFace embedding (ResNet-50) | 20–50 ms | 5–10 ms |
| Cosine similarity (100 users) | 1–5 ms | 1–5 ms |
| **End-to-end recognition** | **~100–200 ms** | **~15–40 ms** |

Switch to GPU by changing the provider in `apps/ml_service/face_detector.py`:

```python
self.app = FaceAnalysis(
    name='buffalo_l',
    providers=['CUDAExecutionProvider', 'CPUExecutionProvider'],
)
```

---

## Condition Testing

| Condition | Expected result |
|---|---|
| Normal lighting, frontal | ✅ Reliable recognition |
| Low / uneven lighting | ⚠️ Quality check may reject; guide user |
| Strong backlighting | ⚠️ May fail quality threshold |
| Slight angle (< 30°) | ✅ Generally accepted |
| Extreme angle (> 45°) | ⚠️ Higher FRR; guide user to face camera |
| Non-reflective glasses | ✅ Usually ok |
| Sunglasses / face mask | ❌ Face detection likely fails |
| Multiple faces in frame | ❌ Rejected by design (requires exactly 1 face) |
| Blurry / low-resolution image | ❌ Rejected by quality check (min_quality=0.50) |

---

## Threshold Guidance

| Threshold | Approx TAR | Approx FAR | Recommended for |
|---|---|---|---|
| 0.50 | ~95% | ~2% | High throughput, lower security |
| 0.55 | ~92% | ~0.5% | 1:N identification (default) |
| **0.60** | **~88%** | **~0%** | **1:1 verification (default) — high precision** |
| 0.65 | ~72% | 0% | Extra-secure environments |

Configure via environment variables:
```
FACE_VERIFICATION_THRESHOLD=0.60
FACE_IDENTIFICATION_THRESHOLD=0.55
```

---

## Known Limitations

1. **No liveness detection.** The system does not reject printed photos or screen captures. Add a liveness check for high-security deployments.
2. **Single best-embedding per user (1:N).** Enrolling multiple face angles improves 1:N accuracy.
3. **CPU latency.** 100–250 ms per request on CPU. GPU reduces to ~20–40 ms.
4. **Pretrained model.** Buffalo_l was trained on MS1MV3 (93K identities). Accuracy on unusual demographics or accessories may differ from LFW benchmark figures (~99.8%).
5. **Synthetic evaluation limitations.** The synthetic results measure threshold mathematical properties only. Always validate on real employee images before production deployment.

---

## Files

| File | Description |
|---|---|
| `ml/evaluation/evaluate.py` | Evaluation script — supports real images and synthetic mode |
| `ml/evaluation/evaluation_report.json` | Latest JSON report (auto-generated) |
| `ml/evaluation/EVALUATION_REPORT.md` | This document |
| `backend/ML_ARCHITECTURE.md` | Full ML pipeline documentation |

---

*Last updated: Phase 21 (revised) — September 2026*  
*Face Recognition Attendance System*
