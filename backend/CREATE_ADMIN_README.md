# How to Create Admin User

## Your Admin Credentials
- **Email**: ebisaberhanu1996@gmail.com
- **Password**: ebisa1234

## Current Issue
MongoDB Atlas connection is timing out. This could be due to:
1. **IP Whitelist**: Your current IP address is not whitelisted in MongoDB Atlas
2. **Network/Firewall**: Your network is blocking MongoDB Atlas connections
3. **SSL/TLS Issues**: Windows SSL certificate issues

## Solutions

### Solution 1: Fix MongoDB Atlas Connection (RECOMMENDED)

#### Step A: Whitelist Your IP in MongoDB Atlas
1. Go to https://cloud.mongodb.com/
2. Select your cluster (cluster0.g4aidzg)
3. Go to **Network Access** in the left sidebar
4. Click **Add IP Address**
5. Either:
   - Click **Add Current IP Address** (recommended for now)
   - Or click **Allow Access from Anywhere** (0.0.0.0/0) - Less secure but works

#### Step B: Once Connection is Fixed, Run:
```bash
cd backend
.\venv\Scripts\python.exe quick_create_admin.py
```

### Solution 2: Use MongoDB Compass (GUI Tool)

1. Download MongoDB Compass from https://www.mongodb.com/try/download/compass
2. Connect using your connection string:
   ```
   mongodb+srv://melalabirhanu285_db_user:N2rnnM0h5COY91mk@cluster0.g4aidzg.mongodb.net/
   ```
3. Select database: `face_attendance`
4. Select collection: `users`
5. Click **Add Data** → **Insert Document**
6. Paste this JSON (you'll need to generate the password hash first):

```json
{
  "_id": "YOUR_GENERATED_ID_HERE",
  "email": "ebisaberhanu1996@gmail.com",
  "password": "pbkdf2_sha256$600000$...",
  "role": "ADMIN",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true,
  "date_joined": "2026-09-08T12:00:00.000Z",
  "last_login": null
}
```

To generate the password hash, run:
```python
from django.contrib.auth.hashers import make_password
print(make_password("ebisa1234"))
```

### Solution 3: Use Local MongoDB (If Atlas Doesn't Work)

If MongoDB Atlas keeps timing out, you can switch to local MongoDB:

1. Install MongoDB locally from https://www.mongodb.com/try/download/community
2. Update `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/
   MONGODB_DATABASE=face_attendance
   ```
3. Restart Django server
4. Run: `.\venv\Scripts\python.exe quick_create_admin.py`

### Solution 4: Create via Django Shell (When Connection Works)

```bash
cd backend
.\venv\Scripts\python.exe manage.py shell
```

Then in the shell:
```python
from django.contrib.auth import get_user_model
User = get_user_model()

admin = User.objects.create_user(
    email='ebisaberhanu1996@gmail.com',
    password='ebisa1234',
    role='ADMIN',
    is_staff=True,
    is_superuser=True
)
print(f"Admin created: {admin.email}")
```

## Verify Admin Was Created

Once connection is working:
```bash
.\venv\Scripts\python.exe list_users.py
```

## Login as Admin

1. Open the frontend: http://localhost:3000
2. Click **Login**
3. Enter:
   - Email: ebisaberhanu1996@gmail.com
   - Password: ebisa1234
4. You should see the Admin Dashboard

## Need Help?

The MongoDB Atlas connection timeout is the blocker. Fix the network/IP whitelist issue first, then creating the admin will work immediately.
