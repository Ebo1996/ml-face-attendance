"""
Recognition URL Configuration

Canonical API contract endpoints:
  POST /api/face/register/         — employee face enrollment
  POST /api/face/recognize/        — face recognition + attendance
  GET  /api/face/embeddings/       — list own embeddings (alias for my-embeddings)
  GET  /api/face/enrollment-stats/ — enrollment stats (alias)
"""

from django.urls import path
from . import views
from apps.ml_service import views as ml_views

app_name = 'recognition'

urlpatterns = [
    # Core recognition endpoints
    path('register/',  views.register_face,  name='register-face'),
    path('recognize/', views.recognize_face, name='recognize-face'),

    # Aliases so the frontend's /api/face/* calls all resolve here
    path('embeddings/',            ml_views.list_my_embeddings_api,  name='list-embeddings'),
    path('embeddings/<str:embedding_id>/', ml_views.delete_embedding_api, name='delete-embedding-alias'),
    path('enrollment-stats/',      ml_views.enrollment_stats_api,    name='enrollment-stats-alias'),
    path('set-primary/',           ml_views.update_primary_embedding_api, name='set-primary-alias'),
    path('validate/',              ml_views.validate_face_api,        name='validate-face-alias'),
]
