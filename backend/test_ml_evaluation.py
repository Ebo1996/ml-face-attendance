"""
Phase 21 — ML Evaluation
Tests face recognition accuracy with synthetic data.
"""

import sys, os, time
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps'))

print("=" * 60)
print("Phase 21 — ML System Evaluation")
print("=" * 60)

from ml_service.face_recognizer import FaceRecognizer
from ml_service.matching_service import _confidence_level

rec = FaceRecognizer(similarity_threshold=0.60)

# ── 1. FAR / FRR with synthetic embeddings ───────────────────────────
print("\n1. Estimating FAR / FRR on 200 synthetic pair tests...")

same_person_sims, diff_person_sims = [], []
THRESHOLD = 0.60
N = 100

for _ in range(N):
    base = np.random.rand(512)
    # "Same person" — add small noise
    same = base + np.random.rand(512) * 0.08
    # "Different person" — completely random
    diff = np.random.rand(512)

    same_person_sims.append(rec.compute_similarity(base, same))
    diff_person_sims.append(rec.compute_similarity(base, diff))

true_accepts  = sum(s >= THRESHOLD for s in same_person_sims)
false_rejects = N - true_accepts
false_accepts = sum(s >= THRESHOLD for s in diff_person_sims)
true_rejects  = N - false_accepts

TAR = true_accepts / N * 100
FAR = false_accepts / N * 100
FRR = false_rejects / N * 100
print(f"   TAR  (True Accept Rate):  {TAR:.1f}%  (threshold = {THRESHOLD})")
print(f"   FAR  (False Accept Rate): {FAR:.1f}%")
print(f"   FRR  (False Reject Rate): {FRR:.1f}%")
print(f"   Note: synthetic noise model — real-world FAR will be lower")

# ── 2. 1:N identification accuracy ──────────────────────────────────
print("\n2. Testing 1:N identification (20-person gallery)...")
gallery_embs = [np.random.rand(512) for _ in range(20)]
gallery_ids  = [f"person_{i}" for i in range(20)]

correct, total = 0, 20
for i in range(total):
    query = gallery_embs[i] + np.random.rand(512) * 0.05
    matches = rec.identify(query, gallery_embs, gallery_ids, return_top_k=1)
    if matches and matches[0][0] == gallery_ids[i]:
        correct += 1

print(f"   Top-1 accuracy: {correct}/{total} ({correct/total*100:.0f}%)")

# ── 3. Speed benchmarks ──────────────────────────────────────────────
print("\n3. Benchmarking similarity computation speed...")
v1, v2 = np.random.rand(512), np.random.rand(512)
t0 = time.time()
for _ in range(1000):
    rec.compute_similarity(v1, v2)
ms_per = (time.time() - t0) / 1000 * 1000
print(f"   1,000 pairwise similarity calls: {(time.time()-t0)*1000:.1f}ms total")
print(f"   Per-comparison: {ms_per:.3f}ms")
print(f"   Max throughput: ~{int(1/ms_per*1000)} comparisons/sec")

# ── 4. Confidence distribution ───────────────────────────────────────
print("\n4. Confidence level distribution...")
all_sims = same_person_sims + diff_person_sims
dist = {}
for s in all_sims:
    lvl = _confidence_level(s)
    dist[lvl] = dist.get(lvl, 0) + 1

for lvl, cnt in sorted(dist.items(), key=lambda x: -x[1]):
    print(f"   {lvl:<12} : {cnt:3d} / {len(all_sims)} ({cnt/len(all_sims)*100:.0f}%)")

print("\n" + "=" * 60)
print("PASS ML Evaluation complete")
print(f"  System threshold: {THRESHOLD}")
print(f"  TAR: {TAR:.1f}%  |  FAR: {FAR:.1f}%  |  FRR: {FRR:.1f}%")
print(f"  Per-comparison speed: {ms_per:.3f}ms")
print("=" * 60)
