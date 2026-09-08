"""
Direct Atlas cleanup — deletes all face_embeddings and face_registration_sessions.
Uses pymongo directly, no Django ORM startup required.
"""
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
uri = os.getenv('MONGODB_URI')
if not uri:
    print('ERROR: MONGODB_URI not found in .env')
    exit(1)

print(f'Connecting to Atlas...')
client = MongoClient(uri, serverSelectionTimeoutMS=15000)

try:
    client.admin.command('ping')
    print('Connected OK')
except Exception as e:
    print(f'Connection failed: {e}')
    exit(1)

db = client['face_attendance']

# Show what's there
embs = list(db['face_embeddings'].find({}, {'_id': 1, 'quality_score': 1, 'is_active': 1}))
print(f'\nface_embeddings: {len(embs)} documents')
for e in embs:
    print(f'  _id={e["_id"]}  quality={e.get("quality_score")}  active={e.get("is_active")}')

sessions = db['face_registration_sessions'].count_documents({})
print(f'face_registration_sessions: {sessions} documents')

# Delete all embeddings
r1 = db['face_embeddings'].delete_many({})
print(f'\nDeleted {r1.deleted_count} embedding(s)')

# Delete sessions too (they block nothing but keep it clean)
r2 = db['face_registration_sessions'].delete_many({})
print(f'Deleted {r2.deleted_count} session(s)')

print('\nAll clear — you can now register your face fresh.')
client.close()
