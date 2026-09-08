"""
Create employee profiles for existing users
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
print("Creating Employee Profiles")
print("=" * 60)

# Get all users with EMPLOYEE role
employees = User.objects.filter(role='EMPLOYEE', is_active=True)

print(f"\nFound {employees.count()} employee users")

created_count = 0
existing_count = 0

for user in employees:
    # Check if profile already exists
    profile, created = EmployeeProfile.objects.get_or_create(
        user=user,
        defaults={
            'first_name': '',
            'last_name': '',
            'phone': '',
            'department': 'General',
            'position': 'Employee',
            'employee_id': f'EMP{str(user.id)[:8].upper()}',
        }
    )
    
    if created:
        created_count += 1
        print(f"✓ Created profile for {user.email}")
        print(f"  Employee ID: {profile.employee_id}")
    else:
        existing_count += 1
        print(f"  Profile already exists for {user.email}")

print("\n" + "=" * 60)
print(f"Summary:")
print(f"  Created: {created_count}")
print(f"  Already existed: {existing_count}")
print(f"  Total: {employees.count()}")
print("=" * 60)

# Now check total profiles
all_profiles = EmployeeProfile.objects.all()
print(f"\nTotal employee profiles in database: {all_profiles.count()}")
for profile in all_profiles:
    print(f"  - {profile.get_full_name()} ({profile.user.email})")
    print(f"    Department: {profile.department}, Position: {profile.position}")
    print(f"    Employee ID: {profile.employee_id}")
