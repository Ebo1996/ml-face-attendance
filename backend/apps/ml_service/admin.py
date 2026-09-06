"""
Admin interface for ML Service models
"""

from django.contrib import admin
from .models import FaceEmbedding, FaceRegistrationSession


@admin.register(FaceEmbedding)
class FaceEmbeddingAdmin(admin.ModelAdmin):
    """Admin interface for Face Embeddings."""
    
    list_display = [
        'id',
        'user',
        'quality_score',
        'detection_confidence',
        'is_primary',
        'is_active',
        'verified_by_admin',
        'registration_source',
        'created_at',
    ]
    
    list_filter = [
        'is_primary',
        'is_active',
        'verified_by_admin',
        'registration_source',
        'gender',
        'created_at',
    ]
    
    search_fields = [
        'user__email',
        'user__first_name',
        'user__last_name',
        'notes',
    ]
    
    readonly_fields = [
        'id',
        'embedding_dimension',
        'created_at',
        'updated_at',
    ]
    
    fieldsets = (
        ('User Information', {
            'fields': ('id', 'user')
        }),
        ('Embedding Data', {
            'fields': ('embedding', 'embedding_dimension')
        }),
        ('Quality Metrics', {
            'fields': ('quality_score', 'detection_confidence')
        }),
        ('Face Attributes', {
            'fields': ('estimated_age', 'gender', 'image_width', 'image_height')
        }),
        ('Registration', {
            'fields': ('is_primary', 'registration_source', 'notes')
        }),
        ('Status', {
            'fields': ('is_active', 'verified_by_admin')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    actions = ['activate_embeddings', 'deactivate_embeddings', 'verify_embeddings']
    
    def activate_embeddings(self, request, queryset):
        """Activate selected embeddings."""
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} embedding(s) activated.")
    activate_embeddings.short_description = "Activate selected embeddings"
    
    def deactivate_embeddings(self, request, queryset):
        """Deactivate selected embeddings."""
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} embedding(s) deactivated.")
    deactivate_embeddings.short_description = "Deactivate selected embeddings"
    
    def verify_embeddings(self, request, queryset):
        """Verify selected embeddings."""
        updated = queryset.update(verified_by_admin=True)
        self.message_user(request, f"{updated} embedding(s) verified.")
    verify_embeddings.short_description = "Mark as verified by admin"


@admin.register(FaceRegistrationSession)
class FaceRegistrationSessionAdmin(admin.ModelAdmin):
    """Admin interface for Face Registration Sessions."""
    
    list_display = [
        'id',
        'user',
        'session_type',
        'attempts_count',
        'successful',
        'started_at',
        'completed_at',
    ]
    
    list_filter = [
        'session_type',
        'successful',
        'started_at',
    ]
    
    search_fields = [
        'user__email',
        'user__first_name',
        'user__last_name',
        'failure_reason',
    ]
    
    readonly_fields = [
        'id',
        'started_at',
        'completed_at',
    ]
    
    fieldsets = (
        ('Session Information', {
            'fields': ('id', 'user', 'session_type')
        }),
        ('Status', {
            'fields': ('attempts_count', 'successful', 'failure_reason')
        }),
        ('Client Information', {
            'fields': ('user_agent', 'ip_address')
        }),
        ('Timestamps', {
            'fields': ('started_at', 'completed_at')
        }),
    )
