from django.apps import AppConfig


class RecognitionConfig(AppConfig):
    default_auto_field = 'django_mongodb_backend.fields.ObjectIdAutoField'
    name = 'apps.recognition'
    label = 'recognition'
