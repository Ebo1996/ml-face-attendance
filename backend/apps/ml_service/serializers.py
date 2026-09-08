"""
Serializers for Face Enrollment API
"""

from rest_framework import serializers
from .models import FaceEmbedding, FaceRegistrationSession


class FaceEmbeddingSerializer(serializers.ModelSerializer):
    """Serializer for Face Embedding model (list/detail views)."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    embedding_dimension = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = FaceEmbedding
        fields = [
            'id',
            'user_email',
            'user_name',
            'quality_score',
            'detection_confidence',
            'estimated_age',
            'gender',
            'image_width',
            'image_height',
            'is_primary',
            'registration_source',
            'notes',
            'is_active',
            'verified_by_admin',
            'embedding_dimension',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user_email',
            'user_name',
            'quality_score',
            'detection_confidence',
            'estimated_age',
            'gender',
            'image_width',
            'image_height',
            'embedding_dimension',
            'created_at',
            'updated_at',
        ]
    
    def get_user_name(self, obj):
        """Get user's full name."""
        try:
            p = obj.user.employee_profile
            return f"{p.first_name} {p.last_name}".strip() or obj.user.email
        except Exception:
            return obj.user.email


class FaceEnrollmentRequestSerializer(serializers.Serializer):
    """Serializer for face enrollment request."""
    
    image_data = serializers.CharField(
        required=True,
        help_text="Base64-encoded image data"
    )
    
    is_primary = serializers.BooleanField(
        default=False,
        help_text="Whether this should be the primary face embedding"
    )
    
    registration_source = serializers.ChoiceField(
        choices=[
            'WEB_UPLOAD',
            'MOBILE_CAPTURE',
            'WEBCAM_CAPTURE',
            'ADMIN_UPLOAD',
        ],
        default='WEB_UPLOAD',
        help_text="Source of the face registration"
    )
    
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500,
        help_text="Optional notes about this enrollment"
    )


class FaceValidationRequestSerializer(serializers.Serializer):
    """Serializer for face validation request (no enrollment)."""
    
    image_data = serializers.CharField(
        required=True,
        help_text="Base64-encoded image data"
    )


class FaceValidationResponseSerializer(serializers.Serializer):
    """Serializer for face validation response."""
    
    is_valid = serializers.BooleanField()
    quality_score = serializers.FloatField(required=False)
    detection_confidence = serializers.FloatField(required=False)
    estimated_age = serializers.IntegerField(required=False)
    gender = serializers.CharField(required=False)
    message = serializers.CharField(required=False)
    error = serializers.CharField(required=False)


class FaceEnrollmentResponseSerializer(serializers.Serializer):
    """Serializer for face enrollment response."""
    
    success = serializers.BooleanField()
    message = serializers.CharField(required=False)
    error = serializers.CharField(required=False)
    embedding = FaceEmbeddingSerializer(required=False)


class EnrollmentStatsSerializer(serializers.Serializer):
    """Serializer for enrollment statistics."""
    
    total_embeddings = serializers.IntegerField()
    active_embeddings = serializers.IntegerField()
    has_primary = serializers.BooleanField()
    verified_count = serializers.IntegerField()
    average_quality = serializers.FloatField(required=False)
    best_quality = serializers.FloatField(required=False)
    worst_quality = serializers.FloatField(required=False)


class UpdatePrimaryEmbeddingSerializer(serializers.Serializer):
    """Serializer for updating primary embedding."""
    
    embedding_id = serializers.CharField(
        required=True,
        help_text="ID of the embedding to make primary"
    )


class FaceRegistrationSessionSerializer(serializers.ModelSerializer):
    """Serializer for Face Registration Session."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    duration_seconds = serializers.SerializerMethodField()
    
    class Meta:
        model = FaceRegistrationSession
        fields = [
            'id',
            'user_email',
            'session_type',
            'attempts_count',
            'successful',
            'failure_reason',
            'user_agent',
            'ip_address',
            'started_at',
            'completed_at',
            'duration_seconds',
        ]
        read_only_fields = ['id', 'user_email', 'duration_seconds']
    
    def get_duration_seconds(self, obj):
        """Calculate session duration in seconds."""
        if obj.completed_at and obj.started_at:
            delta = obj.completed_at - obj.started_at
            return int(delta.total_seconds())
        return None


# =========================================================
# Matching Serializers  (Phase 11)
# =========================================================

class VerifyFaceRequestSerializer(serializers.Serializer):
    """Request body for 1:1 verification."""
    image_data = serializers.CharField(required=True)


class MatchCandidateSerializer(serializers.Serializer):
    """Single candidate from 1:N identification."""
    user_id = serializers.CharField()
    similarity = serializers.FloatField()
    confidence_level = serializers.CharField()


class VerifyFaceResponseSerializer(serializers.Serializer):
    """Response from 1:1 verification."""
    success = serializers.BooleanField()
    is_match = serializers.BooleanField()
    similarity = serializers.FloatField(required=False)
    confidence_level = serializers.CharField(required=False)
    message = serializers.CharField(required=False)
    error = serializers.CharField(required=False, allow_null=True)
    processing_time_ms = serializers.FloatField(required=False)


class IdentifyFaceRequestSerializer(serializers.Serializer):
    """Request body for 1:N identification."""
    image_data = serializers.CharField(required=True)
    top_k = serializers.IntegerField(default=3, min_value=1, max_value=10)


class IdentifyFaceResponseSerializer(serializers.Serializer):
    """Response from 1:N identification."""
    success = serializers.BooleanField()
    identified = serializers.BooleanField()
    top_match = MatchCandidateSerializer(required=False, allow_null=True)
    candidates = MatchCandidateSerializer(many=True, required=False)
    error = serializers.CharField(required=False, allow_null=True)
    processing_time_ms = serializers.FloatField(required=False)


class CacheStatsSerializer(serializers.Serializer):
    """Embedding cache statistics."""
    cached_users = serializers.IntegerField()
    all_users_cached = serializers.BooleanField()
    cache_ttl_seconds = serializers.IntegerField()
