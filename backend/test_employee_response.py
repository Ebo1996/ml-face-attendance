"""
Check the exact API response format
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import dns.resolver
resolver = dns.resolver.Resolver()
resolver.nameservers = ['8.8.8.8', '8.8.4.4']
dns.resolver.default_resolver = resolver

from apps.employees.serializers import EmployeeListSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

print("=" * 70)
print("Employee API Response Format Test")
print("=" * 70)

users = User.objects.all()
serializer = EmployeeListSerializer(users, many=True)
data = serializer.data

print(f"\nTotal users: {len(data)}")
print(f"\nFirst employee (JSON format):")
if len(data) > 0:
    print(json.dumps(data[0], indent=2, default=str))

print(f"\nAll employees summary:")
for emp in data:
    print(f"  {emp['email']:35} | {emp['full_name']:20} | {emp['role']:8} | Active: {emp['is_active']}")
