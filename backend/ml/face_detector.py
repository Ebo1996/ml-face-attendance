"""
ml/face_detector.py
===================
SCRFD face-detection wrapper.

This module is a thin, Django-independent facade over the InsightFace
implementation that lives in apps/ml_service/face_detector.py.
Keeping it here (ml/) satisfies the spec directory structure while
avoiding code duplication.

Usage
-----
    from ml.face_detector import detect_faces, detect_single_face, get_quality_score

    image = cv2.imread("photo.jpg")
    faces = detect_faces(image)          # list[dict]
    face  = detect_single_face(image)    # dict | None
    score = get_quality_score(face)      # float 0-1
"""

from __future__ import annotations
import numpy as np
from typing import List, Optional, Tuple

# ---------------------------------------------------------------------------
# Re-export from the Django-app implementation so there is a single source of
# truth.  The ml/ layer is intentionally thin.
# ---------------------------------------------------------------------------
from apps.ml_service.face_detector import (
    FaceDetector,
    get_face_detector,
)


# ---------------------------------------------------------------------------
# Convenience module-level functions
# ---------------------------------------------------------------------------

def detect_faces(image: np.ndarray, max_faces: int = 10) -> List[dict]:
    """
    Detect all faces in *image* (BGR numpy array).

    Returns a list of face dicts::

        {
            'bbox'       : [x1, y1, x2, y2],
            'kps'        : [[x,y], ...],   # 5 keypoints
            'det_score'  : float,          # detection confidence 0-1
            'embedding'  : [512 floats],   # ArcFace embedding
            'age'        : int | None,
            'gender'     : int | None,     # 0=female, 1=male
        }
    """
    return get_face_detector().detect_faces(image, max_num=max_faces)


def detect_single_face(image: np.ndarray) -> Optional[dict]:
    """
    Detect exactly one face in *image*.

    Returns the face dict, or ``None`` if zero or >1 faces are found.
    """
    return get_face_detector().detect_single_face(image)


def get_quality_score(face: dict) -> float:
    """Return a quality score [0, 1] for an already-detected face dict."""
    return get_face_detector().get_face_quality_score(face)


def is_valid_face(face: dict, min_quality: float = 0.5) -> bool:
    """Return True if the face passes the minimum quality threshold."""
    return get_face_detector().is_valid_face(face, min_quality)


__all__ = [
    "FaceDetector",
    "get_face_detector",
    "detect_faces",
    "detect_single_face",
    "get_quality_score",
    "is_valid_face",
]
