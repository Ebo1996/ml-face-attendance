# 🔑 Setup Your Own Credentials

This guide helps you set up your own MongoDB Atlas database and Google OAuth credentials for local development.

---

## 📋 What You Need

1. **MongoDB Atlas Account** (Free tier available)
2. **Google Cloud Account** (Free, requires credit card verification)
3. **10-15 minutes of your time**

---

## Step 1: Setup MongoDB Atlas

### 1.1 Create Account

1. Go to: https://cloud.mongodb.com/
2. Click **"Try Free"**
3. Sign up with:
   - Email address
   - Or use Google/GitHub sign-in

### 1.2 Create Cluster

1. After login, click **"Create"** → **"Cluster"**
2. Choose **"Shared"** (Free tier)
3. Select:
   - **Cloud Provider:** AWS (recommended) or Google Cloud
   - **Region:** Choose closest to your location
4. Click **"Create Cluster"** (takes 3-5 minutes)

### 1.3 Create Database User

1. Click **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter:
   - **Username:** `your_username`
   - **Password:** Click "Autogenerate Secure Password" (copy it!)
   - **Database User Privileges:** Atlas admin
5. Click **"Add User"**

⚠️ **Save your password** - you'll need it in a moment!

### 1.4 Allow Network Access

1. Click **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ For production, restrict to your server IP only
4. Click **"Confirm"**

### 1.5 Get Connection String

1. Click **"Database"** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

5. Replace:
   - `<username>` with your database username
   - `<password>` with your database password

**Example:**
```
mongodb+srv://myuser:MyP@ssw0rd123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

---

## Step 2: Setup Google OAuth

### 2.1 Create Google Cloud Project

1. Go to: https://console.cloud.google.com/
2. Sign in with Google account
3. Click **"Select a project"** → **"New Project"**
4. Enter:
   - **Project name:** `Face Attendance System`
   - **Location:** (leave default)
5. Click **"Create"**

### 2.2 Enable Google+ API

1. In left menu, go to **"APIs & Services"** → **"Library"**
2. Search for: **"Google+ API"**
3. Click on it
4. Click **"Enable"**

### 2.3 Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"**
3. Click **"Create"**
4. Fill in:
   - **App name:** `Face Attendance System`
   - **User support email:** Your email
   - **Developer contact:** Your email
5. Click **"Save and Continue"**
6. **Scopes:** Click "Save and Continue" (no changes needed)
7. **Test users:** Click "Save and Continue" (optional)
8. Click **"Back to Dashboard"**

### 2.4 Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Choose **"Web application"**
4. Enter:
   - **Name:** `Face Attendance Web Client`
   
5. **Authorized JavaScript origins:**
   - Click **"Add URI"**
   - Add: `http://localhost:3000`
   - Click **"Add URI"** again
   - Add: `http://127.0.0.1:3000`
   
6. **Authorized redirect URIs:**
   - Click **"Add URI"**
   - Add: `http://localhost:3000`
   - Click **"Add URI"** again  
   - Add: `http://localhost:3000/auth/callback`

7. Click **"Create"**

### 2.5 Copy Credentials

A popup will show your credentials:

- **Client ID:** `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret:** `GOCSPX-xxxxxxxxxxxxx`

⚠️ **Save both** - you'll need them!

You can also download the JSON file for safekeeping.

---

## Step 3: Update Your .env Files

### 3.1 Backend Configuration

Open `backend/.env` and update:

```env
# MongoDB Configuration - Replace with your values
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true
MONGODB_DATABASE=face_attendance_dev

# No other changes needed for development
```

**Example:**
```env
MONGODB_URI=mongodb+srv://myuser:MyP@ssw0rd123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true
MONGODB_DATABASE=face_attendance_dev
```

### 3.2 Frontend Configuration

Open `frontend/.env` and update:

```env
# API Base URL (no change needed)
VITE_API_BASE_URL=http://localhost:8000/api

# Google OAuth Client ID - Replace with yours
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

**Example:**
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
```

⚠️ **Note:** Only use Client ID in frontend, NOT the Client Secret!

---

## Step 4: Verify Setup

### 4.1 Test Backend Connection

```bash
cd backend

# Activate virtual environment (if using one)
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Test MongoDB connection
python manage.py check

# Run migrations
python manage.py migrate

# Start backend
python manage.py runserver
```

**Expected output:**
```
System check identified no issues (0 silenced).
Django version 5.2.x, using settings 'config.settings'
Starting development server at http://127.0.0.1:8000/
```

### 4.2 Test Frontend

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start frontend
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxxx ms
➜  Local:   http://localhost:3000/
```

### 4.3 Test Google OAuth

1. Open browser: http://localhost:3000
2. Click **"Login"**
3. Click **"Continue with Google"**
4. Sign in with your Google account
5. Should redirect back to dashboard

If you see an error, check:
- Client ID is correct in `frontend/.env`
- Authorized origins include `http://localhost:3000`

---

## 🔄 Production Setup (Later)

When deploying to production:

### MongoDB Atlas

1. **Create new cluster** (or use same one)
2. **Create production database user**
3. **Whitelist production server IP** (not 0.0.0.0/0)
4. **Use different database name** (e.g., `face_attendance_prod`)

### Google OAuth

1. **Create new OAuth credentials** (production)
2. **Add production domain** to authorized origins:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`
3. **Add production redirect URIs:**
   - `https://yourdomain.com`
   - `https://yourdomain.com/auth/callback`

---

## 🆘 Troubleshooting

### MongoDB Connection Errors

**Error:** `ServerSelectionTimeoutError`

**Solutions:**
1. Check username/password are correct
2. Check Network Access (0.0.0.0/0 allowed)
3. Check cluster is active (not paused)
4. Check connection string has `&tls=true&tlsAllowInvalidCertificates=true`

**Error:** `Authentication failed`

**Solutions:**
1. Verify password is correct (no extra spaces)
2. Check user has "Atlas admin" privileges
3. Password might have special characters - URL encode them

### Google OAuth Errors

**Error:** `redirect_uri_mismatch`

**Solutions:**
1. Check redirect URIs in Google Console
2. Must include exact URL: `http://localhost:3000`
3. Check Client ID is correct in frontend `.env`

**Error:** `Access blocked: This app's request is invalid`

**Solutions:**
1. Complete OAuth consent screen configuration
2. Add test user (your email) in consent screen
3. Ensure Google+ API is enabled

**Error:** `idpiframe_initialization_failed`

**Solutions:**
1. Check browser allows third-party cookies
2. Try in incognito/private mode
3. Check browser console for specific error

---

## 📝 Quick Reference

### MongoDB Atlas URLs
- **Dashboard:** https://cloud.mongodb.com/
- **Connection String Format:**
  ```
  mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
  ```

### Google Cloud URLs
- **Console:** https://console.cloud.google.com/
- **APIs & Services:** https://console.cloud.google.com/apis/
- **Credentials:** https://console.cloud.google.com/apis/credentials

### Environment Files
- **Backend:** `backend/.env`
- **Frontend:** `frontend/.env`
- **Templates:** `.env.example` and `.env.production.example`

---

## ✅ Checklist

- [ ] Created MongoDB Atlas account
- [ ] Created cluster and database user
- [ ] Allowed network access (0.0.0.0/0)
- [ ] Copied MongoDB connection string
- [ ] Created Google Cloud project
- [ ] Enabled Google+ API
- [ ] Configured OAuth consent screen
- [ ] Created OAuth credentials
- [ ] Copied Client ID and Client Secret
- [ ] Updated `backend/.env` with MongoDB URI
- [ ] Updated `frontend/.env` with Google Client ID
- [ ] Tested backend connection
- [ ] Tested frontend startup
- [ ] Tested Google OAuth login

---

## 🎉 Success!

If all checks passed, you're ready to develop!

**Next steps:**
1. Start backend: `cd backend && python manage.py runserver`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser: http://localhost:3000
4. Create account or login with Google
5. Start developing! 🚀

---

## 📞 Need Help?

- **GitHub Issues:** https://github.com/Ebo1996/face-attendance-system/issues
- **Email:** ebisaberhanu1996@gmail.com

**Don't share your credentials publicly!** 🔒

---

**Author:** Ebisa Berhanu (@Ebo1996)  
**Last Updated:** September 2026
