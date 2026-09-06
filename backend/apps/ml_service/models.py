"""
Face Recognition Models
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()


def generate_id():
    """Generate a 24-character ID for MongoDB compatibility."""
    return str(uuid.uuid4().hex[:24])


class FaceEmbedding(models.Model):
    """
    Store face embeddings for employees.
    
    Each employee can have multiple face embeddings (different angles, lighting, etc.)
    which can be averaged for better recognition accuracy.
    """
    
    id = models.CharField(
        max_length=24,
        primary_key=True,
        default=generate_id,
        editable=False
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='face_embeddings',
        help_text="User this face embedding belongs to"
    )
    
    # 512-dimensional face embedding stored as JSON array
    embedding = models.JSONField(
        help_text="512-dimensional face embedding vector"
    )
    
    # Metadata
    quality_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Face quality score (0-1)"
    )
    
    detection_confidence = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Face detection confidence score"
    )
    
    # Optional face attributes from InsightFace
    estimated_age = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(120)],
        help_text="Estimated age from face analysis"
    )
    
    gender = models.CharField(
        max_length=10,
        choices=[
            ('MALE', 'Male'),
            ('FEMALE', 'Female'),
            ('UNKNOWN', 'Unknown'),
        ],
        null=True,
        blank=True,
        help_text="Estimated gender from face analysis"
    )
    
    # Face image metadata
    image_width = models.IntegerField(
        null=True,
        blank=True,
        help_text="Original image width in pixels"
    )
    
    image_height = models.IntegerField(
        null=True,
        blank=True,
        help_text="Original image height in pixels"
    )
    
    # Registration metadata
    is_primary = models.BooleanField(
        default=False,
        help_text="Whether this is the primary embedding for the user"
    )
    
    registration_source = models.CharField(
        max_length=50,
        choices=[
            ('WEB_UPLOAD', 'Web Upload'),
            ('MOBILE_CAPTURE', 'Mobile Capture'),
            ('WEBCAM_CAPTURE', 'Webcam Capture'),
            ('ADMIN_UPLOAD', 'Admin Upload'),
        ],
        default='WEB_UPLOAD',
        help_text="Source of face registration"
    )
    
    notes = models.TextField(
        blank=True,
        default='',
        help_text="Optional notes about this embedding"
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this embedding is active for recognition"
    )
    
    verified_by_admin = models.BooleanField(
        default=False,
        help_text="Whether an admin has verified this face"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        app_label = 'ml_service'
        db_table = 'face_embeddings'
        ordering = ['-is_primary', '-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['is_primary']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Face embedding for {self.user.email} (Quality: {self.quality_score:.2f})"
    
    def save(self, *args, **kwargs):
        """
        Override save to ensure only one primary embedding per user.
        """
        if self.is_primary:
            # Set all other embeddings for this user to non-primary
            FaceEmbedding.objects.filter(
                user=self.user,
                is_primary=True
            ).exclude(id=self.id).update(is_primary=False)
        
        super().save(*args, **kwargs)
    
    @property
    def embedding_dimension(self):
        """Get the dimension of the embedding vector."""
        if self.embedding and isinstance(self.embedding, list):
            return len(self.embedding)
        return 0
    
    @classmethod
    def get_active_embeddings_for_user(cls, user):
        """Get all active embeddings for a user."""
        return cls.objects.filter(user=user, is_active=True)
    
    @classmethod
    def get_primary_embedding_for_user(cls, user):
        """Get the primary embedding for a user."""
        try:
            return cls.objects.get(user=user, is_primary=True, is_active=True)
        except cls.DoesNotExist:
            return None


class FaceRegistrationSession(models.Model):
    """
    Track face registration sessions for analytics and debugging.
    """
    
    id = models.CharField(
        max_length=24,
        primary_key=True,
        default=generate_id,
        editable=False
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='face_registration_sessions',
        help_text="User registering their face"
    )
    
    session_type = models.CharField(
        max_length=50,
        choices=[
            ('INITIAL', 'Initial Registration'),
            ('UPDATE', 'Update Existing'),
            ('RE_ENROLL', 'Re-enrollment'),
        ],
        default='INITIAL',
        help_text="Type of registration session"
    )
    
    # Session metadata
    attempts_count = models.IntegerField(
        default=0,
        help_text="Number of capture attempts in this session"
    )
    
    successful = models.BooleanField(
        default=False,
        help_text="Whether the registration was successful"
    )
    
    failure_reason = models.TextField(
        blank=True,
        default='',
        help_text="Reason for registration failure, if any"
    )
    
    # Device/browser info
    user_agent = models.TextField(
        blank=True,
        default='',
        help_text="User agent string"
    )
    
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of the client"
    )
    
    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        app_label = 'ml_service'
        db_table = 'face_registration_sessions'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', 'successful']),
            models.Index(fields=['started_at']),
        ]
    
    def __str__(self):
        status = "Success" if self.successful else "Failed"
        return f"{self.session_type} session for {self.user.email} - {status}"
