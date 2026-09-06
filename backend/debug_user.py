#!/usr/bin/env python
"""Debug user ID issue."""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User

# Get user
user = User.objects.get(email='newuser@example.com')

print(f"User email: {user.email}")
print(f"User pk: {user.pk}")
print(f"User id: {user.id}")
print(f"User id type: {type(user.id)}")
print(f"User pk type: {type(user.pk)}")
print(f"Has id attr: {hasattr(user, 'id')}")
print(f"ID value: {getattr(user, 'id', 'NO ID')}")
print(f"PK value: {getattr(user, 'pk', 'NO PK')}")

# Check _id (MongoDB uses _id)
print(f"\nMongoDB _id: {getattr(user, '_id', 'NO _ID')}")

# Check all attributes
print(f"\nAll attributes:")
for attr in dir(user):
    if not attr.startswith('_') and not callable(getattr(user, attr)):
        print(f"  {attr}: {getattr(user, attr)}")
