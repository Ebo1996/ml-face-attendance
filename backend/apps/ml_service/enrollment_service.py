"""
Face Enrollment Service

Handles face registration, validation, and quality checks.
"""

import numpy as np
from typing import Tuple, Optional, Dict, Any
import logging

from .face_detector import get_face_detector
from .face_recognizer import get_face_recognizer
from .utils.image_utils import load_image_from_base64, validate_image
from .models import FaceEmbedding

logger = logging.getLogger(__name__)


class FaceEnrollmentService:
    """
    Service for enrolling new faces into the system.
    
    Handles:
    - Face detection and validation
    - Quality assessment
    - Duplicate detection
    - Embedding storage
    """
    
    def __init__(
        self,
        min_quality_score: float = 0.5,
        min_detection_confidence: float = 0.9,
        duplicate_threshold: float = 0.8
    ):
        """
        Initialize enrollment service.
        
        Args:
            min_quality_score: Minimum face quality score (0-1)
            min_detection_confidence: Minimum detection confidence (0-1)
            duplicate_threshold: Threshold for detecting duplicate enrollments
        """
        self.detector = get_face_detector()
        self.recognizer = get_face_recognizer()
        self.min_quality_score = min_quality_score
        self.min_detection_confidence = min_detection_confidence
        self.duplicate_threshold = duplicate_threshold
        
        logger.info(
            f"Face enrollment service initialized with "
            f"min_quality={min_quality_score}, "
            f"min_confidence={min_detection_confidence}, "
            f"duplicate_threshold={duplicate_threshold}"
        )
    
    def validate_face_image(
        self,
        image_data: str
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Validate a face image for enrollment.
        
        Args:
            image_data: Base64-encoded image string
            
        Returns:
            Tuple of (is_valid, face_data, error_message)
            - is_valid: Whether the image is valid for enrollment
            - face_data: Dict with face data if valid
            - error_message: Error message if invalid
        """
        try:
            # Load image from base64
            image = load_image_from_base64(image_data)
            
            # Validate image
            is_valid, error = validate_image(image)
            if not is_valid:
                return False, None, error
            
            # Detect face
            face = self.detector.detect_single_face(image)
            
            if face is None:
                # Check if no face or multiple faces
                faces = self.detector.detect_faces(image, max_faces=5)
                if len(faces) == 0:
                    return False, None, "No face detected in the image"
                else:
                    return False, None, f"Multiple faces detected ({len(faces)}). Please ensure only one face is visible"
            
            # Check detection confidence
            det_score = face['det_score']
            if det_score < self.min_detection_confidence:
                return False, None, f"Face detection confidence too low ({det_score:.2f}). Please use a clearer photo"
            
            # Check face quality
            quality_score = self.detector.get_face_quality_score(face)
            if quality_score < self.min_quality_score:
                return False, None, f"Face quality too low ({quality_score:.2f}). Please use better lighting and a clearer photo"
            
            # All checks passed
            face_data = {
                'bbox': face['bbox'],
                'embedding': face['embedding'],
                'quality_score': quality_score,
                'detection_confidence': det_score,
                'estimated_age': face.get('age'),
                'gender': self._map_gender(face.get('gender')),
                'image_width': image.shape[1],
                'image_height': image.shape[0],
            }
            
            logger.info(
                f"Face validation successful: quality={quality_score:.3f}, "
                f"confidence={det_score:.3f}"
            )
            
            return True, face_data, None
            
        except Exception as e:
            logger.error(f"Face validation failed: {e}")
            return False, None, f"Failed to process image: {str(e)}"
    
    def check_duplicate_enrollment(
        self,
        user,
        new_embedding: np.ndarray
    ) -> Tuple[bool, Optional[str], Optional[float]]:
        """
        Check if this face is already enrolled for the user.
        
        Args:
            user: User object
            new_embedding: New face embedding to check
            
        Returns:
            Tuple of (is_duplicate, embedding_id, similarity_score)
        """
        try:
            # Get existing embeddings for this user
            existing_embeddings = FaceEmbedding.get_active_embeddings_for_user(user)
            
            if not existing_embeddings:
                return False, None, None
            
            # Check similarity with existing embeddings
            for emb_obj in existing_embeddings:
                existing_emb = np.array(emb_obj.embedding)
                similarity = self.recognizer.compute_similarity(new_embedding, existing_emb)
                
                if similarity >= self.duplicate_threshold:
                    logger.warning(
                        f"Duplicate face detected for user {user.email}: "
                        f"similarity={similarity:.3f} with embedding {emb_obj.id}"
                    )
                    return True, emb_obj.id, similarity
            
            return False, None, None
            
        except Exception as e:
            logger.error(f"Duplicate check failed: {e}")
            # Don't block enrollment on duplicate check failure
            return False, None, None
    
    def enroll_face(
        self,
        user,
        face_data: Dict[str, Any],
        is_primary: bool = False,
        registration_source: str = 'WEB_UPLOAD',
        notes: str = ''
    ) -> Tuple[bool, Optional[FaceEmbedding], Optional[str]]:
        """
        Enroll a face into the system.
        
        Args:
            user: User object
            face_data: Face data from validate_face_image()
            is_primary: Whether this is the primary embedding
            registration_source: Source of registration
            notes: Optional notes
            
        Returns:
            Tuple of (success, face_embedding_object, error_message)
        """
        try:
            embedding_array = np.array(face_data['embedding'])
            
            # Check for duplicates
            is_duplicate, dup_id, similarity = self.check_duplicate_enrollment(
                user, embedding_array
            )
            
            if is_duplicate:
                return False, None, (
                    f"This face is already enrolled (similarity: {similarity:.2f}). "
                    f"Please use a different photo or update the existing enrollment."
                )
            
            # Create face embedding record
            face_embedding = FaceEmbedding.objects.create(
                user=user,
                embedding=face_data['embedding'],
                quality_score=face_data['quality_score'],
                detection_confidence=face_data['detection_confidence'],
                estimated_age=face_data.get('estimated_age'),
                gender=face_data.get('gender'),
                image_width=face_data.get('image_width'),
                image_height=face_data.get('image_height'),
                is_primary=is_primary,
                registration_source=registration_source,
                notes=notes,
                is_active=True,
                verified_by_admin=False,
            )
            
            logger.info(
                f"Face enrolled successfully for user {user.email}: "
                f"embedding_id={face_embedding.id}, quality={face_data['quality_score']:.3f}"
            )
            
            return True, face_embedding, None
            
        except Exception as e:
            logger.error(f"Face enrollment failed: {e}")
            return False, None, f"Failed to enroll face: {str(e)}"
    
    def update_primary_embedding(
        self,
        user,
        embedding_id: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Update which embedding is primary for a user.
        
        Args:
            user: User object
            embedding_id: ID of embedding to make primary
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            # Get the embedding
            embedding = FaceEmbedding.objects.get(id=embedding_id, user=user)
            
            # Set as primary (will automatically unset others)
            embedding.is_primary = True
            embedding.save()
            
            logger.info(f"Updated primary embedding for user {user.email} to {embedding_id}")
            return True, None
            
        except FaceEmbedding.DoesNotExist:
            return False, "Embedding not found"
        except Exception as e:
            logger.error(f"Failed to update primary embedding: {e}")
            return False, str(e)
    
    def delete_embedding(
        self,
        user,
        embedding_id: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Delete (deactivate) a face embedding.
        
        Args:
            user: User object
            embedding_id: ID of embedding to delete
            
        Returns:
            Tuple of (success, error_message)
        """
        try:
            # Get the embedding
            embedding = FaceEmbedding.objects.get(id=embedding_id, user=user)
            
            # Soft delete by deactivating
            embedding.is_active = False
            embedding.save()
            
            # If this was primary, promote another one
            if embedding.is_primary:
                other_active = FaceEmbedding.objects.filter(
                    user=user,
                    is_active=True
                ).order_by('-quality_score').first()
                
                if other_active:
                    other_active.is_primary = True
                    other_active.save()
                    logger.info(f"Promoted embedding {other_active.id} to primary for user {user.email}")
            
            logger.info(f"Deleted embedding {embedding_id} for user {user.email}")
            return True, None
            
        except FaceEmbedding.DoesNotExist:
            return False, "Embedding not found"
        except Exception as e:
            logger.error(f"Failed to delete embedding: {e}")
            return False, str(e)
    
    def get_enrollment_stats(self, user) -> Dict[str, Any]:
        """
        Get enrollment statistics for a user.
        
        Args:
            user: User object
            
        Returns:
            Dict with enrollment statistics
        """
        embeddings = FaceEmbedding.objects.filter(user=user)
        active_embeddings = embeddings.filter(is_active=True)
        
        stats = {
            'total_embeddings': embeddings.count(),
            'active_embeddings': active_embeddings.count(),
            'has_primary': active_embeddings.filter(is_primary=True).exists(),
            'verified_count': embeddings.filter(verified_by_admin=True).count(),
        }
        
        if active_embeddings.exists():
            avg_quality = sum(e.quality_score for e in active_embeddings) / len(active_embeddings)
            stats['average_quality'] = round(avg_quality, 3)
            stats['best_quality'] = round(max(e.quality_score for e in active_embeddings), 3)
            stats['worst_quality'] = round(min(e.quality_score for e in active_embeddings), 3)
        
        return stats
    
    @staticmethod
    def _map_gender(gender_value: Optional[int]) -> Optional[str]:
        """Map InsightFace gender value to string."""
        if gender_value is None:
            return None
        return 'MALE' if gender_value == 1 else 'FEMALE'


# Global service instance (singleton)
_enrollment_service: Optional[FaceEnrollmentService] = None


def get_enrollment_service() -> FaceEnrollmentService:
    """
    Get global face enrollment service instance (singleton pattern).
    
    Returns:
        FaceEnrollmentService instance
    """
    global _enrollment_service
    
    if _enrollment_service is None:
        _enrollment_service = FaceEnrollmentService()
    
    return _enrollment_service
