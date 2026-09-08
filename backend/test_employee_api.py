"""
Test employee API response format
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import dns.resolver
import json

# Configure DNS resolver
resolver = dns.resolver.Resolver()
resolver.nameservers = ['8.8.8.8', '8.8.4.4']
dns.resolver.default_resolver = resolver

from django.test.client import RequestFactory
from django.contrib.auth import get_user_model
from apps.employees.views import EmployeeListView

User = get_user_model()

print("=" * 70)
print("Testing Employee API Response")
print("=" * 70)

# Get admin user
admin = User.objects.filter(role='ADMIN', email='ebisaberhanu1996@gmail.com').first()

if admin:
    factory = RequestFactory()
    request = factory.get('/api/employees/')
    request.user = admin
    
    view = EmployeeListView.as_view()
    response = view(request)
    
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.data
        print(f"Number of employees: {len(data)}")
        print(f"\nFirst employee data structure:")
        if len(data) > 0:
            first_emp = data[0]
            print(json.dumps(first_emp, indent=2, default=str))
            
        print(f"\nAll employees:")
        for emp in data:
            print(f"  - {emp.get('email', 'N/A')}: {emp.get('full_name', 'N/A')} ({emp.get('role', 'N/A')})")
    else:
        print(f"Error: {response.data}")
else:
    print("Admin user not found!")
