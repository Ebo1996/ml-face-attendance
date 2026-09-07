"""
ml/embedding_service.py
=======================
End-to-end pipeline: image → validated face → 512-d embedding.

This service combines face detection (SCRFD) and embedding extraction
(ArcFace / buffalo_l) into a single callable used by the Django
recognition and enrollment views.

The pipeline:
    Image (BGR numpy array or base64 string)
        ↓
    OpenCV pre-processing  (decode, resize if needed)
        ↓
    InsightFace SCRFD      (detect face, landmarks)
        ↓
    InsightFace buffalo_l  (extract 512-d embedding)
        ↓
    Quality validation     (confidence, size)
        ↓
    Returns embedding + metadata

No raw embeddings are returned to the Django REST layer — the
matching_service.py compares them internally and returns only
a decision (recognised / not recognised) and a confidence score.
"""

from __future__ import annotations
import numpy as np
from typing import Dict, Any, Optional, Tuple

from apps.ml_service.utils.image_utils import (
    load_image_from_base64,
    load_image_from_bytes,
    validate_image,
)
from ml.face_detector import detect_single_face, detect_faces, get_quality_score


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class EmbeddingResult:
    """Structured result returned by ``extract_embedding``."""

    def __init__(
        self,
        success: bool,
        embedding: Optional[np.ndarray] = None,
        quality_score: float = 0.0,
        detection_confidence: float = 0.0,
        age: Optional[int] = None,
        gender: Optional[str] = None,
        image_width: Optional[int] = None,
        image_height: Optional[int] = None,
        error: Optional[str] = None,
    ):
        self.success              = success
        self.embedding            = embedding          # 512-d np.ndarray
        self.quality_score        = quality_score
        self.detection_confidence = detection_confidence
        self.age                  = age
        self.gender               = gender
        self.image_width          = image_width
        self.image_height         = image_height
        self.error                = error

    def to_dict(self) -> Dict[str, Any]:
        """Serialise metadata (embedding excluded — never sent to client)."""
        return {
            'success':              self.success,
            'quality_score':        round(self.quality_score, 4),
            'detection_confidence': round(self.detection_confidence, 4),
            'age':                  self.age,
            'gender':               self.gender,
            'image_width':          self.image_width,
            'image_height':         self.image_height,
            'error':                self.error,
        }


def extract_embedding_from_base64(
    image_data: str,
    min_quality: float = 0.50,
    min_confidence: float = 0.85,
) -> EmbeddingResult:
    """
    Full pipeline from a base64-encoded image string.

    Parameters
    ----------
    image_data      Base64 JPEG/PNG string (with or without data-URI prefix).
    min_quality     Minimum face quality score [0, 1] (default 0.50).
    min_confidence  Minimum detection confidence [0, 1] (default 0.85).

    Returns
    -------
    EmbeddingResult
        ``.success = True``  if a valid single face was found and embedded.
        ``.success = False`` with ``.error`` message otherwise.
    """
    try:
        image = load_image_from_base64(image_data)
    except Exception as exc:
        return EmbeddingResult(success=False, error=f"Image decode error: {exc}")

    return _extract(image, min_quality, min_confidence)


def extract_embedding_from_bytes(
    image_bytes: bytes,
    min_quality: float = 0.50,
    min_confidence: float = 0.85,
) -> EmbeddingResult:
    """Same as ``extract_embedding_from_base64`` but accepts raw bytes."""
    try:
        image = load_image_from_bytes(image_bytes)
    except Exception as exc:
        return EmbeddingResult(success=False, error=f"Image decode error: {exc}")

    return _extract(image, min_quality, min_confidence)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _extract(
    image: np.ndarray,
    min_quality: float,
    min_confidence: float,
) -> EmbeddingResult:
    """Core extraction logic shared by both public functions."""

    # 1. Basic image validation
    is_valid, err = validate_image(image)
    if not is_valid:
        return EmbeddingResult(success=False, error=err)

    h, w = image.shape[:2]

    # 2. Detect faces
    faces = detect_faces(image, max_faces=5)

    if len(faces) == 0:
        return EmbeddingResult(success=False, error="No face detected in image.")
    if len(faces) > 1:
        return EmbeddingResult(
            success=False,
            error=f"Multiple faces detected ({len(faces)}). "
                  "Ensure only one person is visible.",
        )

    face = faces[0]

    # 3. Confidence check
    conf = float(face['det_score'])
    if conf < min_confidence:
        return EmbeddingResult(
            success=False,
            error=f"Low detection confidence ({conf:.2f}). "
                  "Use better lighting and face the camera directly.",
        )

    # 4. Quality check
    quality = get_quality_score(face)
    if quality < min_quality:
        return EmbeddingResult(
            success=False,
            error=f"Face quality too low ({quality:.2f}). "
                  "Ensure good lighting and a clear, unobstructed view.",
        )

    # 5. Gender mapping
    gender_int = face.get('gender')
    gender_str: Optional[str] = None
    if gender_int == 1:
        gender_str = 'MALE'
    elif gender_int == 0:
        gender_str = 'FEMALE'

    return EmbeddingResult(
        success=True,
        embedding=np.array(face['embedding'], dtype=np.float32),
        quality_score=quality,
        detection_confidence=conf,
        age=face.get('age'),
        gender=gender_str,
        image_width=w,
        image_height=h,
    )


__all__ = ["EmbeddingResult", "extract_embedding_from_base64", "extract_embedding_from_bytes"]
