from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django_mongodb_backend.fields.ObjectIdAutoField'
    name = 'apps.accounts'
    label = 'accounts'
