"""
Custom AppConfig classes for Django built-in apps to use MongoDB ObjectIdAutoField.
Required by django-mongodb-backend for admin, auth, and contenttypes apps.
"""

from django.contrib.admin.apps import AdminConfig
from django.contrib.auth.apps import AuthConfig
from django.contrib.contenttypes.apps import ContentTypesConfig


class MongoAdminConfig(AdminConfig):
    """Custom AdminConfig that uses ObjectIdAutoField for MongoDB compatibility."""
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"


class MongoAuthConfig(AuthConfig):
    """Custom AuthConfig that uses ObjectIdAutoField for MongoDB compatibility."""
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"


class MongoContentTypesConfig(ContentTypesConfig):
    """Custom ContentTypesConfig that uses ObjectIdAutoField for MongoDB compatibility."""
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"


# SimpleJWT token_blacklist app
try:
    from rest_framework_simplejwt.token_blacklist.apps import TokenBlacklistConfig
    
    class MongoTokenBlacklistConfig(TokenBlacklistConfig):
        """Custom TokenBlacklistConfig that uses ObjectIdAutoField for MongoDB compatibility."""
        name = 'rest_framework_simplejwt.token_blacklist'
        default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
except ImportError:
    pass
