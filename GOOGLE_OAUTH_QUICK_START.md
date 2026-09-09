# 🚀 Google OAuth Quick Start

## ✅ What's Been Done

I've added "Continue with Google" buttons to your Login and Register pages!

### Files Created/Modified:

**Frontend:**
- ✅ `frontend/src/components/auth/GoogleOAuthButton.tsx` - Google OAuth button component
- ✅ `frontend/src/pages/auth/LoginPage.tsx` - Added Google sign-in
- ✅ `frontend/src/pages/auth/RegisterPage.tsx` - Added Google sign-up
- ✅ `frontend/.env` - Environment configuration

**Backend:**
- ✅ `backend/apps/accounts/google_auth.py` - Google OAuth handler
- ✅ `backend/apps/accounts/urls.py` - Added `/api/auth/google/` endpoint

**Documentation:**
- ✅ `GOOGLE_OAUTH_SETUP.md` - Complete setup guide

---

## 🎯 Next Steps (5 minutes)

### 1. Get Google OAuth Credentials

1. Go to: https://console.cloud.google.com/
2. Create/select a project
3. Go to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Configure:
   - Application type: **Web application**
   - Name: **Face Attendance**
   - Authorized JavaScript origins:
     - `http://localhost:3000`
   - Authorized redirect URIs:
     - `http://localhost:3000`
6. Copy the **Client ID** (looks like: `123456-abc.apps.googleusercontent.com`)

### 2. Add Client ID to Frontend

Edit `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
```

Replace `YOUR_CLIENT_ID_HERE` with your actual Client ID from step 1.

### 3. Restart Frontend Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd frontend
npm run dev
```

### 4. Test It!

1. Go to http://localhost:3000/login
2. You'll see **"Continue with Google"** button
3. Click it
4. Select your Google account
5. You're logged in! 🎉

---

## 📱 How It Works

### Login Flow:
```
User clicks "Continue with Google"
  ↓
Google login popup appears
  ↓
User selects Google account
  ↓
Google returns credential token
  ↓
Frontend sends token to backend (/api/auth/google/)
  ↓
Backend verifies token with Google
  ↓
Backend creates/finds user account
  ↓
Backend returns JWT tokens
  ↓
User is logged in!
```

### Features:
- ✅ One-click sign in/sign up
- ✅ No password needed
- ✅ Automatic account creation
- ✅ User info from Google (name, email, picture)
- ✅ Secure OAuth 2.0
- ✅ Works with existing auth system

---

## 🎨 UI Preview

Your pages now have:

**Login Page:**
```
┌─────────────────────────────────┐
│  Email: [                    ]  │
│  Password: [                 ]  │
│  [      Sign In      ]          │
│                                 │
│  ─────────── OR ───────────     │
│                                 │
│  [🔵 Continue with Google]      │
│                                 │
│  ──── New here? ────            │
│  [ Create a new account ]       │
└─────────────────────────────────┘
```

**Register Page:**
```
┌─────────────────────────────────┐
│  Email: [                    ]  │
│  Password: [                 ]  │
│  Confirm: [                  ]  │
│  [    Create Account    ]       │
│                                 │
│  ─────────── OR ───────────     │
│                                 │
│  [🔵 Sign up with Google]       │
│                                 │
│  ── Already registered? ──      │
│  [   Sign in instead   ]        │
└─────────────────────────────────┘
```

---

## 🔒 Security

- Google handles authentication (very secure!)
- No passwords stored for OAuth users
- Email verification by Google
- JWT tokens for API access
- Role-based access control (EMPLOYEE default)

---

## 🧪 Testing

**Test Account Creation:**
1. Click "Continue with Google" on register page
2. Select a Gmail account (that hasn't registered before)
3. Should create account and redirect to dashboard

**Test Login:**
1. Click "Continue with Google" on login page
2. Select same Gmail account
3. Should log in and redirect to dashboard

---

## ⚙️ Configuration

### Optional: Configure OAuth Consent Screen

If you see "This app isn't verified" warning:

1. Go to **APIs & Services** → **OAuth consent screen**
2. Fill in:
   - App name: **Face Attendance**
   - User support email: Your email
   - Developer email: Your email
3. Add scopes: `email`, `profile`
4. Add test users (your Gmail addresses)
5. Save

---

## 🐛 Troubleshooting

### Button doesn't appear:
- Check that `VITE_GOOGLE_CLIENT_ID` is set in `frontend/.env`
- Restart frontend server after adding the ID

### "Invalid token" error:
- Verify Client ID is correct
- Check authorized origins in Google Console include `http://localhost:3000`

### Backend errors:
- Check backend logs for specific error
- Ensure `/api/auth/google/` endpoint exists

---

## 📚 Additional Info

**Without Client ID:**
- Button shows message: "Google OAuth not configured"
- Regular email/password login still works

**With Client ID:**
- Full Google OAuth functionality
- Button styled with Google branding
- Automatic account creation

---

**That's it! Google OAuth is ready to use!** 🎉

Just add your Client ID to `.env` and restart the frontend.
