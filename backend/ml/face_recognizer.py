"""
ml/face_recognizer.py
=====================
ArcFace face-recognition wrapper (InsightFace buffalo_l).

Thin facade over apps/ml_service/face_recognizer.py.

Usage
-----
    from ml.face_recognizer import compute_similarity, verify, identify

    sim   = compute_similarity(emb1, emb2)           # float 0-1
    match, score = verify(emb1, emb2)                # (bool, float)
    hits  = identify(query_emb, known_embs, ids)     # [(id, score), ...]
"""

from __future__ import annotations
import numpy as np
from typing import List, Optional, Tuple

from apps.ml_service.face_recognizer import (
    FaceRecognizer,
    get_face_recognizer,
)


# ---------------------------------------------------------------------------
# Module-level convenience functions
# ---------------------------------------------------------------------------

def compute_similarity(emb1: np.ndarray, emb2: np.ndarray) -> float:
    """
    Compute cosine similarity between two 512-d face embeddings.

    Returns a value in [0, 1] — higher means more similar.
    The raw cosine result ([-1, 1]) is normalised: (cos + 1) / 2.
    """
    return get_face_recognizer().compute_similarity(emb1, emb2)


def verify(
    emb1: np.ndarray,
    emb2: np.ndarray,
    threshold: float = 0.60,
) -> Tuple[bool, float]:
    """
    1:1 verification — are these two embeddings the same person?

    Returns ``(is_match, similarity_score)``.
    """
    rec = get_face_recognizer(threshold)
    return rec.verify(emb1, emb2)


def identify(
    query: np.ndarray,
    known_embeddings: List[np.ndarray],
    known_ids: List[str],
    threshold: float = 0.55,
    top_k: int = 1,
) -> List[Tuple[str, float]]:
    """
    1:N identification — find the best matching identity.

    Returns a list of ``(user_id, similarity)`` tuples, sorted by
    similarity descending, limited to *top_k* results above *threshold*.
    """
    rec = get_face_recognizer(threshold)
    return rec.identify(query, known_embeddings, known_ids, return_top_k=top_k)


def average_embeddings(embeddings: List[np.ndarray]) -> np.ndarray:
    """
    Compute a normalised average embedding from multiple captures of the
    same person.  Useful for building a higher-quality template.
    """
    return get_face_recognizer().average_embeddings(embeddings)


__all__ = [
    "FaceRecognizer",
    "get_face_recognizer",
    "compute_similarity",
    "verify",
    "identify",
    "average_embeddings",
]
