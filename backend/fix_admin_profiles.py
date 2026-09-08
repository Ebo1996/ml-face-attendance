"""
Create profiles for admin users
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
print("Creating Profiles for Admin Users")
print("=" * 60)

# Get all admins
admins = User.objects.filter(role='ADMIN')

print(f"\nFound {admins.count()} admin users\n")

created_count = 0
existing_count = 0

for user in admins:
    # Check if profile already exists
    profile, created = EmployeeProfile.objects.get_or_create(
        user=user,
        defaults={
            'first_name': '',
            'last_name': '',
            'phone': '',
            'department': 'Administration',
            'position': 'Administrator',
            'employee_id': f'ADM{str(user.id)[:8].upper()}',
        }
    )
    
    if created:
        created_count += 1
        print(f"✓ Created profile for {user.email}")
        print(f"  Employee ID: {profile.employee_id}")
        print(f"  Department: {profile.department}")
        print(f"  Position: {profile.position}\n")
    else:
        existing_count += 1
        print(f"  Profile already exists for {user.email}\n")

print("=" * 60)
print(f"Summary:")
print(f"  Created: {created_count}")
print(f"  Already existed: {existing_count}")
print(f"  Total: {admins.count()}")
print("=" * 60)

# Verify all users now have profiles
all_users = User.objects.all()
users_with_profiles = 0
users_without_profiles = 0

for user in all_users:
    try:
        _ = user.employee_profile
        users_with_profiles += 1
    except EmployeeProfile.DoesNotExist:
        users_without_profiles += 1

print(f"\nFinal check:")
print(f"  Users with profiles: {users_with_profiles}")
print(f"  Users without profiles: {users_without_profiles}")
print("=" * 60)
