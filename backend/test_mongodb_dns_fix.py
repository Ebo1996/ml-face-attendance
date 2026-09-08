"""
Test MongoDB Atlas connection with custom DNS resolver
"""
import dns.resolver
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("Testing MongoDB Atlas with Custom DNS")
print("=" * 60)

# Configure DNS resolver to use Google DNS
resolver = dns.resolver.Resolver()
resolver.nameservers = ['8.8.8.8', '8.8.4.4']

print("\n1. Testing DNS resolution with Google DNS...")
try:
    answers = resolver.resolve('cluster0.g4aidzg.mongodb.net', 'A')
    print(f"✓ DNS resolution successful!")
    for rdata in answers:
        print(f"  IP: {rdata}")
except Exception as e:
    print(f"✗ DNS resolution failed: {e}")

# Set the custom resolver globally
dns.resolver.default_resolver = resolver

print("\n2. Testing MongoDB connection...")
MONGODB_URI = os.getenv('MONGODB_URI')

try:
    client = MongoClient(
        MONGODB_URI,
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000
    )
    
    print("   Attempting to ping...")
    client.admin.command('ping')
    
    print("✓ MongoDB Atlas connection successful!")
    
    # Get server info
    info = client.server_info()
    print(f"  MongoDB version: {info['version']}")
    
    # List databases
    print("\n  Available databases:")
    for db_name in client.list_database_names():
        print(f"    - {db_name}")
    
    client.close()
    
except Exception as e:
    print(f"✗ Connection failed: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
