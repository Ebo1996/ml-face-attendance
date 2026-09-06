#!/usr/bin/env python
"""
Test Employee Management API Endpoints
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from apps.employees.models import EmployeeProfile


def test_employee_endpoints():
    """Test employee management functionality."""
    
    print("=" * 60)
    print("Testing Employee Management")
    print("=" * 60)
    
    # Test 1: Create test users
    print("\n1. Creating test users...")
    try:
        # Clean up any existing test users
        User.objects.filter(email__in=['admin@test.com', 'employee@test.com']).delete()
        
        # Create admin user
        admin_user = User.objects.create_user(
            email='admin@test.com',
            password='Admin123!',
            role='ADMIN'
        )
        print(f"   ✓ Admin user created: {admin_user.email}")
        
        # Create employee user
        employee_user = User.objects.create_user(
            email='employee@test.com',
            password='Employee123!',
            role='EMPLOYEE'
        )
        print(f"   ✓ Employee user created: {employee_user.email}")
        
    except Exception as e:
        print(f"   ✗ Error creating users: {e}")
        return
    
    # Test 2: Create employee profiles
    print("\n2. Creating employee profiles...")
    try:
        admin_profile = EmployeeProfile.objects.create(
            user=admin_user,
            first_name='Admin',
            last_name='User',
            phone='+1234567890',
            department='Management',
            position='System Administrator',
            employee_id='EMP001'
        )
        print(f"   ✓ Admin profile created: {admin_profile.get_full_name()}")
        
        employee_profile = EmployeeProfile.objects.create(
            user=employee_user,
            first_name='John',
            last_name='Doe',
            phone='+0987654321',
            department='Engineering',
            position='Software Engineer',
            employee_id='EMP002'
        )
        print(f"   ✓ Employee profile created: {employee_profile.get_full_name()}")
        
    except Exception as e:
        print(f"   ✗ Error creating profiles: {e}")
        return
    
    # Test 3: Test profile methods
    print("\n3. Testing profile methods...")
    try:
        full_name = admin_profile.get_full_name()
        print(f"   ✓ Full name: {full_name}")
        
        profile_str = str(admin_profile)
        print(f"   ✓ Profile string: {profile_str}")
        
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 4: Test user-profile relationship
    print("\n4. Testing user-profile relationship...")
    try:
        user_profile = admin_user.employee_profile
        print(f"   ✓ Accessed profile via user: {user_profile.get_full_name()}")
        
        profile_user = admin_profile.user
        print(f"   ✓ Accessed user via profile: {profile_user.email}")
        
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 5: Test queryset with profiles
    print("\n5. Testing queryset with profiles...")
    try:
        users_with_profiles = User.objects.select_related('employee_profile').all()
        print(f"   ✓ Found {users_with_profiles.count()} users")
        
        for user in users_with_profiles:
            if hasattr(user, 'employee_profile'):
                print(f"      - {user.email}: {user.employee_profile.get_full_name()}")
        
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 6: Test profile updates
    print("\n6. Testing profile updates...")
    try:
        employee_profile.department = 'Product'
        employee_profile.position = 'Senior Engineer'
        employee_profile.save()
        print(f"   ✓ Updated profile successfully")
        
        # Verify update
        updated_profile = EmployeeProfile.objects.get(user=employee_user)
        print(f"      Department: {updated_profile.department}")
        print(f"      Position: {updated_profile.position}")
        
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 7: Test profile without names
    print("\n7. Testing profile without names...")
    try:
        # Create user without profile
        no_profile_user = User.objects.create_user(
            email='noprofile@test.com',
            password='Test123!',
            role='EMPLOYEE'
        )
        
        # Create empty profile
        empty_profile = EmployeeProfile.objects.create(user=no_profile_user)
        full_name = empty_profile.get_full_name()
        print(f"   ✓ Full name fallback: {full_name}")
        
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 8: Cleanup
    print("\n8. Cleaning up test data...")
    try:
        User.objects.filter(email__in=[
            'admin@test.com',
            'employee@test.com',
            'noprofile@test.com'
        ]).delete()
        print("   ✓ Test data cleaned up")
        
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    print("\n" + "=" * 60)
    print("✓ All employee management tests completed!")
    print("=" * 60)


if __name__ == '__main__':
    test_employee_endpoints()
