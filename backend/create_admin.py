"""
Create admin user
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("=" * 60)
print("Creating Admin User")
print("=" * 60)

email = "ebisaberhanu1996@gmail.com"
password = "ebisa1234"

try:
    # Check if user already exists
    if User.objects.filter(email=email).exists():
        existing_user = User.objects.get(email=email)
        print(f"\n⚠️  User already exists: {email}")
        print(f"   Current role: {existing_user.role}")
        
        # Update to admin if not already
        if existing_user.role != 'ADMIN':
            existing_user.role = 'ADMIN'
            existing_user.is_staff = True
            existing_user.is_superuser = True
            existing_user.set_password(password)
            existing_user.save()
            print(f"✓ Updated to ADMIN role")
        else:
            print(f"✓ Already an ADMIN")
            # Update password anyway
            existing_user.set_password(password)
            existing_user.save()
            print(f"✓ Password updated")
    else:
        # Create new admin user
        admin = User.objects.create_user(
            email=email,
            password=password,
            role='ADMIN',
            is_staff=True,
            is_superuser=True,
            is_active=True
        )
        
        print(f"\n✓ Admin user created successfully!")
        print(f"   Email: {admin.email}")
        print(f"   Role: {admin.role}")
        print(f"   ID: {admin.id}")
        print(f"   Is Superuser: {admin.is_superuser}")
        print(f"   Is Staff: {admin.is_staff}")
    
    print("\n" + "=" * 60)
    print("Admin Login Credentials")
    print("=" * 60)
    print(f"Email: {email}")
    print(f"Password: {password}")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ Error creating admin: {e}")
    import traceback
    traceback.print_exc()
