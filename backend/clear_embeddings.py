"""
Utility: delete all face embeddings for a user via the API.
Run once to clear duplicate-blocked embeddings.
"""
import urllib.request
import json
import sys
import os

# Add backend to path so we can use Django ORM to get a token
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from rest_framework_simplejwt.tokens import AccessToken
from apps.accounts.models import User

BASE = 'http://127.0.0.1:8000/api'

# Get user and generate token directly (no password needed)
u = User.objects.filter(email='melalabirhanu285@gmail.com').first()
if not u:
    u = User.objects.filter(role='EMPLOYEE').first()
print(f'User: {u.email}')
token = str(AccessToken.for_user(u))
headers = {'Authorization': f'Bearer {token}'}

# List embeddings
req = urllib.request.Request(f'{BASE}/face/embeddings/', headers=headers, method='GET')
with urllib.request.urlopen(req, timeout=10) as r:
    embs = json.loads(r.read().decode())

print(f'Found {len(embs)} embedding(s)')

# Delete each
for e in embs:
    eid = e['id']
    req2 = urllib.request.Request(
        f'{BASE}/face/embeddings/{eid}/',
        headers=headers,
        method='DELETE'
    )
    try:
        with urllib.request.urlopen(req2, timeout=10) as r2:
            print(f'  Deleted {eid} — status {r2.status}')
    except urllib.error.HTTPError as ex:
        print(f'  Failed to delete {eid}: {ex.code}')

print('Done — you can now register your face fresh.')
