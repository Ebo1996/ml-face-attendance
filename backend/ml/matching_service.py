"""
ml/matching_service.py
======================
Cosine-similarity face-matching engine.

This is the spec's top-level ML entry point used by the Django
recognition API.  It orchestrates:

  1. Embedding extraction  (ml/embedding_service.py)
  2. Database lookup       (apps/ml_service/models.FaceEmbedding)
  3. Similarity matching   (ml/face_recognizer.py)
  4. Decision              (threshold check + active-employee guard)

The result returned to Django views never includes raw embeddings.

Recognition thresholds
----------------------
  VERIFICATION_THRESHOLD   0.60  — 1:1 "is this person X?"
  IDENTIFICATION_THRESHOLD 0.55  — 1:N "who is this person?"

Both are configurable via Django settings:
  settings.FACE_VERIFICATION_THRESHOLD
  settings.FACE_IDENTIFICATION_THRESHOLD
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional
import numpy as np

from ml.embedding_service import extract_embedding_from_base64, EmbeddingResult
from ml.face_recognizer import compute_similarity


# ---------------------------------------------------------------------------
# Settings helpers
# ---------------------------------------------------------------------------

def _verification_threshold() -> float:
    try:
        from django.conf import settings
        return float(getattr(settings, 'FACE_VERIFICATION_THRESHOLD', 0.60))
    except Exception:
        return 0.60


def _identification_threshold() -> float:
    try:
        from django.conf import settings
        return float(getattr(settings, 'FACE_IDENTIFICATION_THRESHOLD', 0.55))
    except Exception:
        return 0.55


# ---------------------------------------------------------------------------
# Result types
# ---------------------------------------------------------------------------

@dataclass
class VerificationResult:
    """Result of a 1:1 identity check."""
    success:           bool
    is_match:          bool             = False
    similarity:        float            = 0.0
    confidence_level:  str              = 'VERY_LOW'
    message:           str              = ''
    error:             Optional[str]    = None
    processing_time_ms: float           = 0.0


@dataclass
class IdentificationResult:
    """Result of a 1:N identity search."""
    success:           bool
    identified:        bool                     = False
    top_user_id:       Optional[str]            = None
    top_similarity:    float                    = 0.0
    confidence_level:  str                      = 'VERY_LOW'
    candidates:        List[dict]               = field(default_factory=list)
    error:             Optional[str]            = None
    processing_time_ms: float                  = 0.0


# ---------------------------------------------------------------------------
# Confidence helper
# ---------------------------------------------------------------------------

def _confidence_level(sim: float) -> str:
    if sim >= 0.90: return 'VERY_HIGH'
    if sim >= 0.80: return 'HIGH'
    if sim >= 0.70: return 'MEDIUM'
    if sim >= 0.60: return 'LOW'
    return 'VERY_LOW'


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def verify_identity(image_data: str, user_embeddings: List[np.ndarray]) -> VerificationResult:
    """
    1:1 Verification — compare a new image against all embeddings belonging
    to a *known* user.

    Parameters
    ----------
    image_data        Base64-encoded image.
    user_embeddings   List of 512-d numpy arrays for the user to verify.

    Returns
    -------
    VerificationResult
    """
    import time
    t0 = time.time()

    emb_result: EmbeddingResult = extract_embedding_from_base64(image_data)
    if not emb_result.success:
        return VerificationResult(
            success=False, error=emb_result.error,
            processing_time_ms=round((time.time() - t0) * 1000, 1),
        )

    if not user_embeddings:
        return VerificationResult(
            success=False,
            error='No enrolled face found. Please register your face first.',
            processing_time_ms=round((time.time() - t0) * 1000, 1),
        )

    threshold  = _verification_threshold()
    best_sim   = max(compute_similarity(emb_result.embedding, e) for e in user_embeddings)
    is_match   = best_sim >= threshold
    confidence = _confidence_level(best_sim)

    return VerificationResult(
        success=True,
        is_match=is_match,
        similarity=round(best_sim, 4),
        confidence_level=confidence,
        message='Identity verified' if is_match else 'Identity not verified',
        processing_time_ms=round((time.time() - t0) * 1000, 1),
    )


def identify_person(
    image_data: str,
    all_user_ids: List[str],
    all_embeddings: List[np.ndarray],
    top_k: int = 3,
) -> IdentificationResult:
    """
    1:N Identification — search *image_data* against every enrolled user.

    Parameters
    ----------
    image_data      Base64-encoded query image.
    all_user_ids    User IDs corresponding to all_embeddings.
    all_embeddings  List of 512-d numpy arrays (one per user, best embedding).
    top_k           Maximum number of candidates to return.

    Returns
    -------
    IdentificationResult
    """
    import time
    t0 = time.time()

    emb_result: EmbeddingResult = extract_embedding_from_base64(image_data)
    if not emb_result.success:
        return IdentificationResult(
            success=False, error=emb_result.error,
            processing_time_ms=round((time.time() - t0) * 1000, 1),
        )

    if not all_user_ids:
        return IdentificationResult(
            success=False,
            error='No enrolled users found in the system.',
            processing_time_ms=round((time.time() - t0) * 1000, 1),
        )

    threshold = _identification_threshold()

    scored = sorted(
        [
            (uid, compute_similarity(emb_result.embedding, emb))
            for uid, emb in zip(all_user_ids, all_embeddings)
        ],
        key=lambda x: x[1],
        reverse=True,
    )

    candidates = [
        {'user_id': uid, 'similarity': round(sim, 4), 'confidence_level': _confidence_level(sim)}
        for uid, sim in scored[:top_k]
        if sim >= threshold
    ]

    identified = bool(candidates)
    top        = candidates[0] if identified else None

    return IdentificationResult(
        success=True,
        identified=identified,
        top_user_id=top['user_id'] if top else None,
        top_similarity=top['similarity'] if top else 0.0,
        confidence_level=top['confidence_level'] if top else 'VERY_LOW',
        candidates=candidates,
        processing_time_ms=round((time.time() - t0) * 1000, 1),
    )


__all__ = [
    "VerificationResult",
    "IdentificationResult",
    "verify_identity",
    "identify_person",
]
