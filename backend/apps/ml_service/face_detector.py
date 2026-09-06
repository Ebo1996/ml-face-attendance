"""
Face Detection Service using InsightFace
"""

import cv2
import numpy as np
from insightface.app import FaceAnalysis
from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class FaceDetector:
    """
    Face detection service using InsightFace RetinaFace detector.
    
    Features:
    - Face detection with bounding boxes
    - Face quality assessment
    - Face alignment
    - Multiple face detection
    """
    
    def __init__(self, det_size: Tuple[int, int] = (640, 640)):
        """
        Initialize face detector.
        
        Args:
            det_size: Detection size (width, height) for preprocessing
        """
        self.det_size = det_size
        self.app = None
        self._initialize()
    
    def _initialize(self):
        """Initialize the InsightFace detector."""
        try:
            logger.info("Initializing InsightFace detector...")
            self.app = FaceAnalysis(
                name='buffalo_l',  # Pre-trained model name
                providers=['CPUExecutionProvider']  # Use CPU (can switch to GPU with CUDAExecutionProvider)
            )
            self.app.prepare(ctx_id=0, det_size=self.det_size)
            logger.info("Face detector initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize face detector: {e}")
            raise
    
    def detect_faces(self, image: np.ndarray, max_faces: int = 1) -> List[dict]:
        """
        Detect faces in an image.
        
        Args:
            image: Input image as numpy array (BGR format)
            max_faces: Maximum number of faces to detect
            
        Returns:
            List of face dictionaries containing:
                - bbox: [x1, y1, x2, y2] bounding box
                - kps: 5 facial keypoints (eyes, nose, mouth corners)
                - det_score: Detection confidence score
                - embedding: 512-d face embedding vector
                - age: Estimated age
                - gender: Gender (0=female, 1=male)
        """
        if self.app is None:
            raise RuntimeError("Face detector not initialized")
        
        try:
            # Detect faces
            faces = self.app.get(image, max_num=max_faces)
            
            if not faces:
                logger.info("No faces detected in image")
                return []
            
            # Convert to dict format
            results = []
            for face in faces:
                face_data = {
                    'bbox': face.bbox.tolist(),  # [x1, y1, x2, y2]
                    'kps': face.kps.tolist(),    # 5 keypoints
                    'det_score': float(face.det_score),
                    'embedding': face.embedding.tolist(),  # 512-d vector
                }
                
                # Add optional attributes if available
                if hasattr(face, 'age'):
                    face_data['age'] = int(face.age)
                if hasattr(face, 'gender'):
                    face_data['gender'] = int(face.gender)
                
                results.append(face_data)
            
            logger.info(f"Detected {len(results)} face(s)")
            return results
            
        except Exception as e:
            logger.error(f"Face detection failed: {e}")
            raise
    
    def detect_single_face(self, image: np.ndarray) -> Optional[dict]:
        """
        Detect exactly one face in an image.
        
        Args:
            image: Input image as numpy array (BGR format)
            
        Returns:
            Face dictionary if exactly one face is detected, None otherwise
        """
        faces = self.detect_faces(image, max_faces=2)
        
        if len(faces) == 0:
            logger.warning("No face detected")
            return None
        elif len(faces) > 1:
            logger.warning(f"Multiple faces detected ({len(faces)}), expected exactly one")
            return None
        
        return faces[0]
    
    def get_face_quality_score(self, face: dict) -> float:
        """
        Calculate face quality score based on detection confidence and size.
        
        Args:
            face: Face dictionary from detect_faces()
            
        Returns:
            Quality score between 0 and 1
        """
        det_score = face['det_score']
        
        # Calculate face size
        bbox = face['bbox']
        width = bbox[2] - bbox[0]
        height = bbox[3] - bbox[1]
        face_area = width * height
        
        # Normalize size score (assuming image size ~640x640)
        # Ideal face size: 150x150 to 400x400
        if face_area < 150 * 150:
            size_score = face_area / (150 * 150)
        elif face_area > 400 * 400:
            size_score = 1.0 - ((face_area - 400 * 400) / (640 * 640))
        else:
            size_score = 1.0
        
        # Combine scores (weighted average)
        quality_score = 0.7 * det_score + 0.3 * size_score
        
        return float(quality_score)
    
    def is_valid_face(self, face: dict, min_quality: float = 0.5) -> bool:
        """
        Check if a detected face meets minimum quality requirements.
        
        Args:
            face: Face dictionary from detect_faces()
            min_quality: Minimum quality score (0-1)
            
        Returns:
            True if face passes quality check
        """
        quality = self.get_face_quality_score(face)
        return quality >= min_quality
    
    @staticmethod
    def draw_faces(image: np.ndarray, faces: List[dict]) -> np.ndarray:
        """
        Draw bounding boxes and keypoints on image.
        
        Args:
            image: Input image
            faces: List of face dictionaries
            
        Returns:
            Image with drawn annotations
        """
        img_copy = image.copy()
        
        for face in faces:
            # Draw bounding box
            bbox = face['bbox']
            x1, y1, x2, y2 = map(int, bbox)
            cv2.rectangle(img_copy, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw keypoints
            kps = face['kps']
            for kp in kps:
                x, y = map(int, kp)
                cv2.circle(img_copy, (x, y), 2, (0, 0, 255), -1)
            
            # Draw detection score
            score = face['det_score']
            cv2.putText(img_copy, f"{score:.2f}", (x1, y1 - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        return img_copy


# Global detector instance (singleton)
_detector_instance: Optional[FaceDetector] = None


def get_face_detector() -> FaceDetector:
    """
    Get global face detector instance (singleton pattern).
    
    Returns:
        FaceDetector instance
    """
    global _detector_instance
    
    if _detector_instance is None:
        _detector_instance = FaceDetector()
    
    return _detector_instance
