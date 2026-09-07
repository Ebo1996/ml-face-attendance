"""
Recognition URL Configuration

Canonical API contract endpoints:
  POST /api/face/register/   — employee face enrollment
  POST /api/face/recognize/  — face recognition + attendance
"""

from django.urls import path
from . import views

app_name = 'recognition'

urlpatterns = [
    path('register/',  views.register_face,  name='register-face'),
    path('recognize/', views.recognize_face, name='recognize-face'),
]
