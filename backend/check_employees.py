"""
Check employee data in detail
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import dns.resolver

# Configure DNS resolver to use Google DNS
resolver = dns.resolver.Resolver()
resolver.nameservers = ['8.8.8.8', '8.8.4.4']
dns.resolver.default_resolver = resolver

from django.contrib.auth import get_user_model
from apps.employees.models import EmployeeProfile

User = get_user_model()

print("=" * 60)
print("Employee Data Check")
print("=" * 60)

# Check all users
all_users = User.objects.all()
print(f"\nTotal users: {all_users.count()}")

# Check all profiles
all_profiles = EmployeeProfile.objects.all()
print(f"Total profiles: {all_profiles.count()}")

print("\n" + "=" * 60)
print("Users with/without profiles:")
print("=" * 60)

for user in all_users:
    has_profile = hasattr(user, 'employee_profile')
    try:
        if has_profile:
            profile = user.employee_profile
            print(f"\n✓ {user.email} (Role: {user.role})")
            print(f"  Has profile: YES")
            print(f"  Employee ID: {profile.employee_id}")
            print(f"  Department: {profile.department}")
            print(f"  Position: {profile.position}")
        else:
            print(f"\n✗ {user.email} (Role: {user.role})")
            print(f"  Has profile: NO")
    except EmployeeProfile.DoesNotExist:
        print(f"\n✗ {user.email} (Role: {user.role})")
        print(f"  Has profile: NO (DoesNotExist)")
    except Exception as e:
        print(f"\n✗ {user.email} (Role: {user.role})")
        print(f"  Error: {e}")

print("\n" + "=" * 60)
