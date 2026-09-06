"""
URL Configuration for Face Enrollment & Matching API
"""

from django.urls import path
from . import views

app_name = 'ml_service'

urlpatterns = [
    # ── Validation ──────────────────────────────────────────
    path('face/validate/', views.validate_face_api, name='validate-face'),

    # ── Enrollment ──────────────────────────────────────────
    path('face/enroll/', views.enroll_face_api, name='enroll-face'),
    path('face/my-embeddings/', views.list_my_embeddings_api, name='my-embeddings'),
    path('face/enrollment-stats/', views.enrollment_stats_api, name='enrollment-stats'),
    path('face/set-primary/', views.update_primary_embedding_api, name='set-primary-embedding'),
    path('face/embeddings/<str:embedding_id>/', views.delete_embedding_api, name='delete-embedding'),
    path('face/registration-sessions/', views.my_registration_sessions_api, name='registration-sessions'),

    # ── Matching (Phase 11) ─────────────────────────────────
    path('face/verify/', views.verify_face_api, name='verify-face'),
    path('face/identify/', views.identify_face_api, name='identify-face'),
    path('face/verify/<str:user_id>/', views.verify_against_user_api, name='verify-against-user'),
    path('face/cache/invalidate/', views.invalidate_cache_api, name='cache-invalidate'),
    path('face/cache/stats/', views.cache_stats_api, name='cache-stats'),
]
