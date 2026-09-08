"""
Quick create admin using pymongo directly with short timeout
"""
import os
import sys
import django

# Setup Django first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import dns.resolver
from pymongo import MongoClient
from bson import ObjectId
from django.contrib.auth.hashers import make_password
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Configure DNS resolver to use Google DNS
resolver = dns.resolver.Resolver()
resolver.nameservers = ['8.8.8.8', '8.8.4.4']
dns.resolver.default_resolver = resolver

MONGODB_URI = os.getenv('MONGODB_URI')
MONGODB_DATABASE = os.getenv('MONGODB_DATABASE', 'face_attendance')

email = "ebisaberhanu1996@gmail.com"
password = "ebisa1234"

print("=" * 60)
print("Creating Admin User via Direct MongoDB")
print("=" * 60)

try:
    print("\nConnecting to MongoDB...")
    # Use very short timeout
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000, connectTimeoutMS=10000)
    
    # Test connection
    client.admin.command('ping')
    print("✓ Connected to MongoDB")
    
    db = client[MONGODB_DATABASE]
    users_collection = db['users']
    
    # Check if user exists
    existing = users_collection.find_one({'email': email})
    
    if existing:
        print(f"\n⚠️  User already exists: {email}")
        # Update to admin
        result = users_collection.update_one(
            {'email': email},
            {
                '$set': {
                    'role': 'ADMIN',
                    'is_staff': True,
                    'is_superuser': True,
                    'is_active': True,
                    'password': make_password(password)
                }
            }
        )
        print(f"✓ Updated to ADMIN role (matched: {result.matched_count}, modified: {result.modified_count})")
    else:
        # Create new admin
        admin_doc = {
            '_id': str(ObjectId()),
            'email': email,
            'password': make_password(password),
            'role': 'ADMIN',
            'is_active': True,
            'is_staff': True,
            'is_superuser': True,
            'date_joined': datetime.utcnow(),
            'last_login': None
        }
        
        result = users_collection.insert_one(admin_doc)
        print(f"\n✓ Admin user created!")
        print(f"   Email: {email}")
        print(f"   ID: {result.inserted_id}")
    
    print("\n" + "=" * 60)
    print("Admin Login Credentials")
    print("=" * 60)
    print(f"Email: {email}")
    print(f"Password: {password}")
    print("=" * 60)
    
    client.close()
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nPossible issues:")
    print("  1. MongoDB Atlas connection timeout")
    print("  2. IP address not whitelisted in Atlas")
    print("  3. Network/firewall blocking connection")
    print("  4. Invalid credentials in connection string")
    import traceback
    traceback.print_exc()
