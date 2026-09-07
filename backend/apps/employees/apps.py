from django.apps import AppConfig


class EmployeesConfig(AppConfig):
    default_auto_field = 'django_mongodb_backend.fields.ObjectIdAutoField'
    name = 'apps.employees'
    label = 'employees'
