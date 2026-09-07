"""
ML Service App Configuration
"""

from django.apps import AppConfig


class MlServiceConfig(AppConfig):
    default_auto_field = 'django_mongodb_backend.fields.ObjectIdAutoField'
    name = 'apps.ml_service'
    verbose_name = 'ML Service'
