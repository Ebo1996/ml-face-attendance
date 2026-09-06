#!/usr/bin/env python
"""
Simple test script for authentication.
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User

def test_user_creation():
    """Test user creation with MongoDB."""
    
    print("=" * 60)
    print("Testing User Model with MongoDB")
    print("=" * 60)
    
    # Test 1: Create a user
    print("\n1. Creating a test user...")
    try:
        # Check if user exists
        existing_users = list(User.objects.filter(email='test@example.com'))
        if existing_users:
            print(f"   Found {len(existing_users)} existing user(s), deleting...")
            for user in existing_users:
                user.delete()
        
        user = User.objects.create_user(
            email='test@example.com',
            password='TestPassword123!',
            role='EMPLOYEE'
        )
        print(f"   ✓ User created successfully")
        print(f"   ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Role: {user.role}")
        print(f"   Password is hashed: {user.password[:20]}...")
        
        # Test 2: Verify password
        print("\n2. Verifying password...")
        if user.check_password('TestPassword123!'):
            print("   ✓ Password verification successful")
        else:
            print("   ✗ Password verification failed")
        
        # Test 3: Retrieve user
        print("\n3. Retrieving user from database...")
        retrieved_user = User.objects.get(email='test@example.com')
        print(f"   ✓ User retrieved successfully")
        print(f"   Email: {retrieved_user.email}")
        print(f"   ID matches: {str(user.id) == str(retrieved_user.id)}")
        
        # Test 4: Update user
        print("\n4. Updating user role...")
        retrieved_user.role = 'ADMIN'
        retrieved_user.save()
        print("   ✓ User updated successfully")
        
        # Verify update
        updated_user = User.objects.get(email='test@example.com')
        print(f"   New role: {updated_user.role}")
        
        # Test 5: Delete user
        print("\n5. Deleting test user...")
        updated_user.delete()
        print("   ✓ User deleted successfully")
        
        # Verify deletion
        remaining = list(User.objects.filter(email='test@example.com'))
        print(f"   Remaining users with this email: {len(remaining)}")
        
        print("\n" + "=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_user_creation()
