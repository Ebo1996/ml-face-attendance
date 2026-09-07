from django.apps import AppConfig


class DashboardConfig(AppConfig):
    default_auto_field = 'django_mongodb_backend.fields.ObjectIdAutoField'
    name = 'apps.dashboard'
    label = 'dashboard'
