"""
List all users in the database
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

User = get_user_model()

print("=" * 60)
print("All Users in Database")
print("=" * 60)

try:
    users = User.objects.all()
    
    if not users:
        print("\n❌ No users found in database")
        print("\nTo create an admin user, run:")
        print("  python manage.py createsuperuser")
    else:
        print(f"\nTotal users: {users.count()}\n")
        
        # Group by role
        admins = users.filter(role='ADMIN')
        employees = users.filter(role='EMPLOYEE')
        
        if admins.exists():
            print(f"🔑 ADMINS ({admins.count()}):")
            for user in admins:
                status = "✓ Active" if user.is_active else "✗ Inactive"
                superuser = " (Superuser)" if user.is_superuser else ""
                print(f"  - {user.email} [{status}]{superuser}")
                print(f"    ID: {user.id}")
                print(f"    Joined: {user.date_joined.strftime('%Y-%m-%d %H:%M')}")
        else:
            print("🔑 ADMINS: None")
        
        print()
        
        if employees.exists():
            print(f"👤 EMPLOYEES ({employees.count()}):")
            for user in employees:
                status = "✓ Active" if user.is_active else "✗ Inactive"
                print(f"  - {user.email} [{status}]")
                print(f"    ID: {user.id}")
                print(f"    Joined: {user.date_joined.strftime('%Y-%m-%d %H:%M')}")
        else:
            print("👤 EMPLOYEES: None")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
