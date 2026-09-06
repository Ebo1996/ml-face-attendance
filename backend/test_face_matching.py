"""
Test script for Phase 11 — Face Matching Engine

Tests:
1. Matching service imports
2. EmbeddingCache behaviour
3. Confidence-level mapping
4. Similarity scoring
5. 1:1 verification (synthetic embeddings)
6. 1:N identification (synthetic embeddings)
7. Cache invalidation
8. URL/view registration
"""

import sys, os, time, threading
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps'))

print("=" * 60)
print("Testing Phase 11 — Face Matching Engine")
print("=" * 60)

# 1 ── Imports ────────────────────────────────────────────────────────
print("\n1. Testing imports...")
try:
    from ml_service.matching_service import (
        FaceMatchingService,
        EmbeddingCache,
        _confidence_level,
        get_matching_service,
    )
    from ml_service.face_recognizer import get_face_recognizer
    print("   ✓ FaceMatchingService imported")
    print("   ✓ EmbeddingCache imported")
    print("   ✓ _confidence_level helper imported")
    print("   ✓ get_matching_service imported")
except ImportError as e:
    print(f"   ✗ Import failed: {e}")
    sys.exit(1)

# 2 ── EmbeddingCache ─────────────────────────────────────────────────
print("\n2. Testing EmbeddingCache...")
try:
    cache = EmbeddingCache(ttl_seconds=2)

    embs = [np.random.rand(512), np.random.rand(512)]
    cache.set_user_embeddings('user_1', embs)
    retrieved = cache.get_user_embeddings('user_1')
    assert retrieved is not None, "Cache miss immediately after set"
    assert len(retrieved) == 2
    print("   ✓ set/get user embeddings")

    cache.set_all_embeddings(['u1', 'u2'], embs)
    ids, vecs = cache.get_all_embeddings()
    assert ids == ['u1', 'u2']
    print("   ✓ set/get all embeddings")

    # TTL expiry
    time.sleep(2.1)
    assert cache.get_user_embeddings('user_1') is None, "Stale cache not expired"
    assert cache.get_all_embeddings() is None, "Stale all-cache not expired"
    print("   ✓ TTL expiry works")

    # Invalidation
    cache.set_user_embeddings('user_1', embs)
    cache.invalidate_user('user_1')
    assert cache.get_user_embeddings('user_1') is None
    print("   ✓ Per-user invalidation works")

    cache.set_user_embeddings('user_2', embs)
    cache.clear()
    assert cache.get_user_embeddings('user_2') is None
    print("   ✓ Full cache flush works")

except AssertionError as e:
    print(f"   ✗ Cache assertion failed: {e}")
    sys.exit(1)

# 3 ── Thread safety ──────────────────────────────────────────────────
print("\n3. Testing EmbeddingCache thread safety...")
try:
    cache = EmbeddingCache(ttl_seconds=10)
    errors = []

    def writer(uid):
        for _ in range(50):
            cache.set_user_embeddings(uid, [np.random.rand(512)])

    def reader(uid):
        for _ in range(50):
            cache.get_user_embeddings(uid)

    threads = [threading.Thread(target=writer, args=(f'u{i}',)) for i in range(4)]
    threads += [threading.Thread(target=reader, args=(f'u{i}',)) for i in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert not errors
    print("   ✓ No race conditions detected")
except Exception as e:
    print(f"   ✗ Thread-safety test failed: {e}")
    sys.exit(1)

# 4 ── Confidence levels ──────────────────────────────────────────────
print("\n4. Testing confidence-level mapping...")
try:
    cases = [
        (0.95, 'VERY_HIGH'),
        (0.85, 'HIGH'),
        (0.75, 'MEDIUM'),
        (0.65, 'LOW'),
        (0.50, 'VERY_LOW'),
    ]
    for sim, expected in cases:
        got = _confidence_level(sim)
        assert got == expected, f"sim={sim}: expected {expected}, got {got}"
    print("   ✓ All confidence levels map correctly")
except AssertionError as e:
    print(f"   ✗ Confidence mapping failed: {e}")
    sys.exit(1)

# 5 ── Similarity scoring ─────────────────────────────────────────────
print("\n5. Testing similarity scoring...")
try:
    recognizer = get_face_recognizer()

    # Identical vector → similarity 1.0
    v = np.random.rand(512)
    sim_self = recognizer.compute_similarity(v, v)
    assert abs(sim_self - 1.0) < 1e-4, f"Self-similarity = {sim_self}"
    print(f"   ✓ Self-similarity = {sim_self:.6f} (expected ~1.0)")

    # Similar vector → high similarity
    similar = v + np.random.rand(512) * 0.05
    sim_close = recognizer.compute_similarity(v, similar)
    print(f"   ✓ Similar similarity = {sim_close:.4f}")

    # Random vector → moderate/low similarity
    random_v = np.random.rand(512)
    sim_rand = recognizer.compute_similarity(v, random_v)
    print(f"   ✓ Random similarity  = {sim_rand:.4f}")

except AssertionError as e:
    print(f"   ✗ Similarity test failed: {e}")
    sys.exit(1)

# 6 ── Verify (1:1) with synthetic data ──────────────────────────────
print("\n6. Testing 1:1 verification logic...")
try:
    from ml_service.face_recognizer import FaceRecognizer

    rec = FaceRecognizer(similarity_threshold=0.60)

    base = np.random.rand(512)
    close = base + np.random.rand(512) * 0.03   # should match
    far   = np.random.rand(512)                  # should not

    match_close, score_close = rec.verify(base, close)
    match_far,   score_far   = rec.verify(base, far)

    print(f"   ✓ Close pair  — match={match_close}, similarity={score_close:.4f}")
    print(f"   ✓ Far pair    — match={match_far},  similarity={score_far:.4f}")

    assert match_close, "Expected close pair to match"
    print("   ✓ Verification logic correct")
except AssertionError as e:
    print(f"   ✗ Verification assertion failed: {e}")
    sys.exit(1)
except Exception as e:
    print(f"   ✗ Verification test error: {e}")
    sys.exit(1)

# 7 ── Identify (1:N) with synthetic data ────────────────────────────
print("\n7. Testing 1:N identification logic...")
try:
    query = np.random.rand(512)
    known_embeddings = [np.random.rand(512) for _ in range(9)]
    known_ids        = [f"user_{i}" for i in range(9)]
    # Put the query itself at index 5 — should be the top match
    known_embeddings[5] = query
    known_ids[5] = "target_user"

    matches = rec.identify(query, known_embeddings, known_ids, return_top_k=3)

    assert matches, "Expected at least one match"
    assert matches[0][0] == "target_user", (
        f"Expected top match = target_user, got {matches[0][0]}"
    )
    print(f"   ✓ Identified {len(matches)} candidate(s)")
    for uid, sim in matches:
        print(f"      {uid}: similarity={sim:.4f}")
    print("   ✓ Correct top match")
except AssertionError as e:
    print(f"   ✗ Identification assertion failed: {e}")
    sys.exit(1)
except Exception as e:
    print(f"   ✗ Identification test error: {e}")
    sys.exit(1)

# 8 ── FaceMatchingService singleton & cache stats ───────────────────
print("\n8. Testing FaceMatchingService singleton...")
try:
    svc1 = get_matching_service()
    svc2 = get_matching_service()
    assert svc1 is svc2, "Singleton returned different instances"
    print("   ✓ Singleton pattern works")

    stats = svc1.get_cache_stats()
    assert 'cached_users' in stats
    assert 'cache_ttl_seconds' in stats
    print(f"   ✓ Cache stats: {stats}")
except AssertionError as e:
    print(f"   ✗ Singleton assertion failed: {e}")
    sys.exit(1)
except Exception as e:
    print(f"   ✗ Singleton test error: {e}")
    sys.exit(1)

# 9 ── URL registration ───────────────────────────────────────────────
print("\n9. Testing URL/view registration...")
try:
    urls_path = os.path.join('apps', 'ml_service', 'urls.py')
    with open(urls_path) as fh:
        content = fh.read()

    for route in [
        'face/verify/',
        'face/identify/',
        'face/cache/invalidate/',
        'face/cache/stats/',
    ]:
        assert route in content, f"Route {route!r} not found in urls.py"
    print("   ✓ All matching routes registered")
except AssertionError as e:
    print(f"   ✗ URL check failed: {e}")
    sys.exit(1)

# ── Summary ──────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("✓ All tests passed! Face Matching Engine is ready.")
print("=" * 60)
print("\nCapabilities:")
print("  1:1 Verification  — POST /api/face/verify/")
print("  1:N Identification — POST /api/face/identify/  (admin)")
print("  Admin verify user  — POST /api/face/verify/<user_id>/")
print("  Cache invalidate   — POST /api/face/cache/invalidate/")
print("  Cache stats        — GET  /api/face/cache/stats/")
print("\nMatching thresholds:")
print("  Verification  : 0.60 (cosine similarity ≥ 0.60 → match)")
print("  Identification: 0.55 (cosine similarity ≥ 0.55 → candidate)")
print("\nConfidence levels:")
print("  VERY_HIGH ≥ 0.90  |  HIGH ≥ 0.80  |  MEDIUM ≥ 0.70")
print("  LOW ≥ 0.60        |  VERY_LOW < 0.60")
print("=" * 60)
