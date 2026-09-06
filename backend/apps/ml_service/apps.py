"""
ML Service App Configuration
"""

from django.apps import AppConfig


class MlServiceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ml_service'
    verbose_name = 'ML Service'
