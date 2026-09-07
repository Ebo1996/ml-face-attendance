# MongoDB-compatible admin initial migration
# django-mongodb-backend handles admin models at runtime
from django.db import migrations


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ('auth', '0001_initial'),
        ('contenttypes', '0001_initial'),
    ]
    operations = []
