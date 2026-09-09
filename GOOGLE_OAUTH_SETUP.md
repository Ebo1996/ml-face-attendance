# Google OAuth Setup Guide

## 📋 Overview
This guide will help you add "Continue with Google" button to your Login and Register pages.

---

## 🔧 Step 1: Get Google OAuth Credentials

### 1.1 Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Create a new project or select existing one
3. Name it: "Face Attendance System"

### 1.2 Enable Google+ API
1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Enable**

### 1.3 Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: **Face Attendance**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Add `email` and `profile`
   - Click **Save and Continue**
   - Test users: Add your Gmail for testing
   - Click **Save and Continue**

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **Face Attendance Web Client**
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://127.0.0.1:3000`
   - Authorized redirect URIs:
     - `http://localhost:3000`
     - `http://localhost:3000/auth/google/callback`
   - Click **Create**

5. **Copy your Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)

---

## 🎨 Step 2: Install Required Package

Open terminal in frontend folder and run:

```bash
npm install @react-oauth/google
```

OR if that's slow:

```bash
npm install react-google-login
```

---

## 📝 Step 3: Add Environment Variable

Create or update `.env` file in frontend folder:

```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID from Step 1.

---

## 🔨 Step 4: Backend Setup (Django)

### 4.1 Install Python Packages

```bash
cd backend
.\venv\Scripts\pip.exe install google-auth google-auth-oauthlib google-auth-httplib2
```

### 4.2 Create Google OAuth View

File: `backend/apps/accounts/google_auth.py`

```python
"""
Google OAuth Authentication
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

GOOGLE_CLIENT_ID = settings.GOOGLE_OAUTH_CLIENT_ID

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Authenticate user with Google OAuth token
    
    POST /api/auth/google/
    Body: { "token": "google_id_token" }
    """
    token = request.data.get('token')
    
    if not token:
        return Response(
            {'error': 'Token is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Get user info from Google
        email = idinfo.get('email')
        given_name = idinfo.get('given_name', '')
        family_name = idinfo.get('family_name', '')
        picture = idinfo.get('picture')
        
        if not email:
            return Response(
                {'error': 'Email not provided by Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user exists
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'role': 'EMPLOYEE',  # Default role
                'is_active': True,
            }
        )
        
        # Create or update employee profile
        from apps.employees.models import EmployeeProfile
        profile, _ = EmployeeProfile.objects.get_or_create(
            user=user,
            defaults={
                'first_name': given_name,
                'last_name': family_name,
                'department': 'General',
                'position': 'Employee',
                'employee_id': f'EMP{str(user.id)[:8].upper()}',
            }
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'is_new_user': created,
            }
        }, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response(
            {'error': f'Invalid token: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {'error': f'Authentication failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

### 4.3 Add URL Route

File: `backend/apps/accounts/urls.py`

Add this import and URL:

```python
from .google_auth import google_auth

urlpatterns = [
    # ... existing URLs ...
    path('google/', google_auth, name='google-auth'),
]
```

### 4.4 Add Settings

File: `backend/config/settings.py`

Add:

```python
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID = os.getenv('GOOGLE_OAUTH_CLIENT_ID', '')
```

### 4.5 Add to .env

File: `backend/.env`

Add:

```
GOOGLE_OAUTH_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

---

## ✅ Step 5: Testing

1. Start backend: `cd backend && .\venv\Scripts\python.exe manage.py runserver`
2. Start frontend: `cd frontend && npm run dev`
3. Go to: http://localhost:3000/login
4. Click "Continue with Google"
5. Select your Google account
6. You should be logged in!

---

## 🎯 Features

✅ One-click sign in with Google
✅ Automatic account creation
✅ No password needed
✅ Secure OAuth 2.0 flow
✅ User profile auto-populated from Google
✅ JWT token generation
✅ Seamless integration with existing auth

---

## 🔒 Security Notes

- Never commit `.env` files
- Keep Client ID and Client Secret secure
- Use HTTPS in production
- Restrict authorized domains in Google Console
- Regular token rotation
- Monitor OAuth logs

---

## 🐛 Troubleshooting

### "Invalid token" error
- Check Client ID matches in frontend and backend
- Verify token hasn't expired
- Ensure Google+ API is enabled

### "Redirect URI mismatch"
- Check authorized redirect URIs in Google Console
- Make sure URLs match exactly (including http/https)

### "Package installation fails"
- Try: `npm install --legacy-peer-deps @react-oauth/google`
- Or use alternative: `npm install react-google-login`

---

## 📚 Resources

- Google OAuth 2.0: https://developers.google.com/identity/protocols/oauth2
- React OAuth: https://www.npmjs.com/package/@react-oauth/google
- Django Google Auth: https://developers.google.com/identity/protocols/oauth2/web-server

---

**Ready to implement!** Follow the steps above and you'll have Google OAuth working in ~30 minutes! 🚀
