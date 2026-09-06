#!/usr/bin/env python
"""
Test script for authentication endpoints.
Run with: python test_auth.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User
from rest_framework.test import APIClient
from rest_framework import status


def test_authentication():
    """Test authentication endpoints."""
    
    client = APIClient()
    
    print("=" * 60)
    print("Testing Authentication Endpoints")
    print("=" * 60)
    
    # Clean up test user if exists
    User.objects.filter(email='testuser@example.com').delete()
    
    # Test 1: Register new user
    print("\n1. Testing User Registration...")
    register_data = {
        'email': 'testuser@example.com',
        'password': 'TestPassword123!',
        'password_confirm': 'TestPassword123!',
        'role': 'EMPLOYEE'
    }
    
    response = client.post('/api/auth/register/', register_data, format='json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 201:
        print("   ✓ Registration successful")
        print(f"   User: {response.data['user']['email']}")
        print(f"   Role: {response.data['user']['role']}")
        access_token = response.data['tokens']['access']
        refresh_token = response.data['tokens']['refresh']
    else:
        print(f"   ✗ Registration failed: {response.data}")
        return
    
    # Test 2: Login with credentials
    print("\n2. Testing User Login...")
    login_data = {
        'email': 'testuser@example.com',
        'password': 'TestPassword123!'
    }
    
    response = client.post('/api/auth/login/', login_data, format='json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        print("   ✓ Login successful")
        print(f"   Access token length: {len(response.data['tokens']['access'])}")
        access_token = response.data['tokens']['access']
    else:
        print(f"   ✗ Login failed: {response.data}")
        return
    
    # Test 3: Get current user (authenticated)
    print("\n3. Testing Get Current User (Authenticated)...")
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    response = client.get('/api/auth/me/')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        print("   ✓ Successfully retrieved user data")
        print(f"   Email: {response.data['email']}")
        print(f"   Role: {response.data['role']}")
    else:
        print(f"   ✗ Failed to get user: {response.data}")
    
    # Test 4: Get current user (unauthenticated)
    print("\n4. Testing Get Current User (Unauthenticated)...")
    client.credentials()  # Remove authentication
    response = client.get('/api/auth/me/')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 401:
        print("   ✓ Correctly denied unauthenticated access")
    else:
        print(f"   ✗ Unexpected response: {response.status_code}")
    
    # Test 5: Refresh token
    print("\n5. Testing Token Refresh...")
    response = client.post('/api/auth/refresh/', {'refresh': refresh_token}, format='json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        print("   ✓ Token refreshed successfully")
        print(f"   New access token length: {len(response.data['access'])}")
    else:
        print(f"   ✗ Token refresh failed: {response.data}")
    
    # Test 6: Login with wrong password
    print("\n6. Testing Login with Wrong Password...")
    wrong_login = {
        'email': 'testuser@example.com',
        'password': 'WrongPassword123!'
    }
    
    response = client.post('/api/auth/login/', wrong_login, format='json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 400:
        print("   ✓ Correctly rejected wrong password")
    else:
        print(f"   ✗ Unexpected response: {response.status_code}")
    
    # Test 7: Register with mismatched passwords
    print("\n7. Testing Registration with Mismatched Passwords...")
    bad_register = {
        'email': 'another@example.com',
        'password': 'TestPassword123!',
        'password_confirm': 'DifferentPassword123!',
        'role': 'EMPLOYEE'
    }
    
    response = client.post('/api/auth/register/', bad_register, format='json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 400:
        print("   ✓ Correctly rejected mismatched passwords")
    else:
        print(f"   ✗ Unexpected response: {response.status_code}")
    
    # Clean up
    print("\n8. Cleaning up test data...")
    User.objects.filter(email='testuser@example.com').delete()
    print("   ✓ Test user deleted")
    
    print("\n" + "=" * 60)
    print("All authentication tests completed!")
    print("=" * 60)


if __name__ == '__main__':
    test_authentication()
