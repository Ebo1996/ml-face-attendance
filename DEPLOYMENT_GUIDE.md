# 🚀 Production Deployment Guide

## ✅ Pre-Deployment Checklist

This application is **ready for deployment** with the following considerations:

### Current Status
- ✅ Backend: Fully functional with Django REST Framework + MongoDB Atlas
- ✅ Frontend: Production build tested and working
- ✅ Google OAuth: Implemented and ready (requires Client ID configuration)
- ✅ Face Recognition: InsightFace buffalo_l integration complete
- ✅ Tests: 58 Django tests + 85 Vitest tests passing
- ✅ Documentation: Complete API, ML, Security, and Accessibility docs
- ✅ Security: Rate limiting, CORS, JWT with refresh tokens

---

## 📋 Deployment Requirements

### Infrastructure
- **Backend Server**: Linux/Windows server with Python 3.10+
- **Frontend Hosting**: Static file hosting (Netlify, Vercel, AWS S3 + CloudFront, nginx)
- **Database**: MongoDB Atlas cluster (Free M0 tier works for development)
- **Domain**: Optional but recommended for HTTPS

### Third-Party Services
- **MongoDB Atlas**: [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- **Google OAuth** (Optional): [https://console.cloud.google.com](https://console.cloud.google.com)

---

## 🔧 Backend Deployment

### 1. Server Setup

```bash
# Clone repository
git clone <your-repo-url>
cd face-attendance-system/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Install production WSGI server
pip install gunicorn
```

### 2. Environment Configuration

Create `backend/.env`:

```env
# Django Core
SECRET_KEY=<generate-50-char-random-key>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=face_attendance

# CORS - Your Frontend Domain
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# Face Recognition Thresholds
FACE_VERIFICATION_THRESHOLD=0.60
FACE_IDENTIFICATION_THRESHOLD=0.55
FACE_RECOGNITION_THRESHOLD=0.4
FACE_DETECTION_CONFIDENCE=0.5

# Production Security (Uncomment for HTTPS)
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

**Generate SECRET_KEY:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3. Pre-Download InsightFace Models

```bash
# This downloads ~300MB of models to avoid timeout on first face request
python - <<'EOF'
import insightface
app = insightface.app.FaceAnalysis(name='buffalo_l')
app.prepare(ctx_id=-1)  # -1 for CPU, 0 for GPU
print("buffalo_l models downloaded successfully.")
EOF
```

Models will be saved to `~/.insightface/models/buffalo_l/`

### 4. Database Migration

```bash
python manage.py migrate
```

### 5. Create Superuser

```bash
python manage.py createsuperuser
```

### 6. Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### 7. Security Check

```bash
python manage.py check --deploy
```

Fix any warnings before proceeding.

### 8. Start Production Server

**Using Gunicorn (Recommended):**

```bash
gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 4 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
```

**Using systemd (Production Service):**

Create `/etc/systemd/system/face-attendance.service`:

```ini
[Unit]
Description=Face Attendance System
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/face-attendance/backend
Environment="PATH=/var/www/face-attendance/backend/venv/bin"
ExecStart=/var/www/face-attendance/backend/venv/bin/gunicorn \
  --workers 4 \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  config.wsgi:application

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start face-attendance
sudo systemctl enable face-attendance
```

### 9. Nginx Reverse Proxy (Recommended)

Create `/etc/nginx/sites-available/face-attendance`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    location /static/ {
        alias /var/www/face-attendance/backend/staticfiles/;
    }

    location /media/ {
        alias /var/www/face-attendance/backend/media/;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/face-attendance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 10. SSL/TLS with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## 🎨 Frontend Deployment

### 1. Environment Configuration

Create `frontend/.env.production`:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 2. Build for Production

```bash
cd frontend
npm install
npm run build
```

This creates a `dist/` folder with optimized static files.

### 3. Deployment Options

#### Option A: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd frontend
netlify deploy --prod --dir=dist
```

**netlify.toml** (in `frontend/`):
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Option B: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

**vercel.json** (in `frontend/`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

#### Option C: AWS S3 + CloudFront

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

#### Option D: Nginx Static Files

```bash
# Copy build files
sudo cp -r dist/* /var/www/face-attendance/frontend/

# Nginx config
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/face-attendance/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

---

## 🔐 Google OAuth Configuration

### 1. Create OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create/select a project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Configure:
   - **Application type**: Web application
   - **Name**: Face Attendance System
   - **Authorized JavaScript origins**:
     - `https://yourdomain.com`
     - `http://localhost:3000` (for development)
   - **Authorized redirect URIs**:
     - `https://yourdomain.com`
     - `http://localhost:3000` (for development)
6. Copy the **Client ID**

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Fill in:
   - **App name**: Face Attendance System
   - **User support email**: your@email.com
   - **Developer contact email**: your@email.com
3. Add scopes: `email`, `profile`, `openid`
4. Add test users if needed (for testing before verification)
5. Save

### 3. Add Client ID to Frontend

Update `frontend/.env.production`:
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

Rebuild and redeploy frontend.

---

## 🗄️ MongoDB Atlas Configuration

### 1. Create Cluster

1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (M0 Free tier available)
3. Choose cloud provider and region

### 2. Database Access

1. Go to **Database Access**
2. Add database user:
   - Username: `face_attendance_user`
   - Password: Generate strong password
   - Database User Privileges: **Read and write to any database**

### 3. Network Access

1. Go to **Network Access**
2. Add IP Address:
   - **For development**: Add your current IP
   - **For production**: Add your server's IP address
   - **For testing**: You can allow `0.0.0.0/0` (all IPs) but this is NOT recommended for production

### 4. Get Connection String

1. Go to **Database** → **Connect**
2. Choose **Drivers** → **Python**
3. Copy connection string:
   ```
   mongodb+srv://face_attendance_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Add to `backend/.env` as `MONGODB_URI`

### 5. Create Database

The database will be created automatically on first migration, or you can create it manually:
1. Go to **Database** → **Browse Collections**
2. Click **Create Database**
3. Database name: `face_attendance`
4. Collection name: `users` (more collections will be auto-created by Django)

---

## 🧪 Testing Deployment

### Backend Health Check

```bash
# Test API endpoint
curl https://api.yourdomain.com/api/
curl https://api.yourdomain.com/api/auth/login/

# Check if models are loaded
# (First request will take ~30 seconds if models weren't pre-downloaded)
```

### Frontend Check

1. Visit `https://yourdomain.com`
2. Check browser console for errors
3. Test login flow
4. Test Google OAuth (if configured)
5. Test face enrollment and recognition

### End-to-End Test

1. Register a new employee account
2. Login
3. Navigate to Face Enrollment
4. Register face via webcam
5. Navigate to Attendance
6. Check-in using face recognition
7. Check-out using face recognition
8. View attendance history

---

## 📊 Monitoring

### Backend Logs

```bash
# View gunicorn logs
journalctl -u face-attendance -f

# View nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### MongoDB Atlas Monitoring

1. Go to **Database** → **Metrics**
2. Monitor:
   - Connections
   - Operations per second
   - Network traffic
   - Document count

### Application Monitoring (Recommended)

- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Session replay and bug tracking
- **New Relic**: Full-stack observability

---

## 🔒 Security Hardening

### Backend

- ✅ `DEBUG=False` in production
- ✅ Strong `SECRET_KEY` (50+ characters)
- ✅ HTTPS only (SSL/TLS certificate)
- ✅ `SECURE_SSL_REDIRECT=True`
- ✅ `SESSION_COOKIE_SECURE=True`
- ✅ `CSRF_COOKIE_SECURE=True`
- ✅ CORS restricted to frontend domain only
- ✅ Rate limiting enabled (10 req/min auth, 20 req/min face)
- ✅ JWT token expiration configured
- ✅ MongoDB IP whitelist configured
- ⚠️ Consider: Regular security updates (`pip list --outdated`)
- ⚠️ Consider: Firewall rules (UFW on Linux)
- ⚠️ Consider: Fail2ban for brute-force protection

### Frontend

- ✅ Environment variables in `.env` files (not in code)
- ✅ API keys not exposed in client code
- ✅ HTTPS only
- ✅ Content Security Policy (CSP) headers
- ⚠️ Consider: Rate limiting at CDN level (Cloudflare)

### MongoDB

- ✅ Authentication enabled
- ✅ IP whitelist configured
- ✅ Strong password
- ⚠️ Consider: Encryption at rest
- ⚠️ Consider: Audit logs enabled

---

## 📦 Backup Strategy

### Database Backups

**MongoDB Atlas Automated Backups:**
1. Go to **Database** → **Backup**
2. Enable **Continuous Cloud Backup** (available on M10+ clusters)
3. Or use **mongodump** for manual backups:

```bash
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/face_attendance" \
  --out=/backups/$(date +%Y%m%d)
```

### Media Files Backup

```bash
# Backup face embeddings and images
tar -czf media-backup-$(date +%Y%m%d).tar.gz /var/www/face-attendance/backend/media/
```

### Automated Daily Backups

Create `/etc/cron.daily/face-attendance-backup`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/face-attendance"
DATE=$(date +%Y%m%d)

# Database backup
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$DATE/db"

# Media backup
tar -czf "$BACKUP_DIR/$DATE/media.tar.gz" /var/www/face-attendance/backend/media/

# Keep only last 7 days
find "$BACKUP_DIR" -type d -mtime +7 -exec rm -rf {} \;
```

Make executable:
```bash
chmod +x /etc/cron.daily/face-attendance-backup
```

---

## 🚨 Common Issues & Solutions

### Issue: "Invalid Google token" error

**Solution:**
1. Verify Google Client ID is correctly set in `frontend/.env`
2. Check authorized origins in Google Cloud Console match your domain
3. Ensure frontend is using HTTPS (Google OAuth requires HTTPS in production)

### Issue: Face recognition timeout

**Solution:**
1. Pre-download InsightFace models before starting server
2. Increase gunicorn timeout: `--timeout 120`
3. Check server has enough RAM (minimum 2GB recommended)

### Issue: CORS errors

**Solution:**
1. Verify `CORS_ALLOWED_ORIGINS` in `backend/.env` includes your frontend URL
2. Ensure URL includes protocol (`https://` not just `yourdomain.com`)
3. No trailing slash in URLs

### Issue: MongoDB connection errors

**Solution:**
1. Check MongoDB Atlas IP whitelist includes server IP
2. Verify connection string includes password and database name
3. Test connection: `python manage.py dbshell`

### Issue: Static files not loading

**Solution:**
1. Run `python manage.py collectstatic`
2. Configure nginx to serve `/static/` directory
3. Check `STATIC_ROOT` and `STATIC_URL` in settings.py

---

## 📈 Performance Optimization

### Backend

- Enable **Gunicorn workers**: `--workers 4` (2 × CPU cores + 1)
- Use **Redis** for caching (optional): Install `django-redis`
- Enable **database indexes**: MongoDB automatically indexes `_id`
- **Compress responses**: Enable gzip in nginx

### Frontend

- ✅ Code splitting (Vite automatic)
- ✅ Lazy loading (React.lazy)
- ✅ Image optimization (compression utility built-in)
- Enable **CDN** for static assets
- Configure **browser caching** (via nginx headers)

### Database

- Review MongoDB Atlas **performance metrics**
- Consider **upgrading cluster tier** if needed (M0 → M10)
- Add **indexes** for frequently queried fields

---

## 📚 Additional Resources

- **Backend API Documentation**: `backend/README.md`
- **ML Architecture**: `backend/ML_ARCHITECTURE.md`
- **Security Documentation**: `backend/SECURITY.md`
- **Accessibility Report**: `frontend/ACCESSIBILITY_REPORT.md`
- **Performance Report**: `frontend/PERFORMANCE_OPTIMIZATION_REPORT.md`
- **Google OAuth Setup**: `GOOGLE_OAUTH_QUICK_START.md`

---

## ✅ Final Checklist

Before going live:

### Backend
- [ ] `DEBUG=False`
- [ ] Strong `SECRET_KEY` generated
- [ ] `ALLOWED_HOSTS` configured
- [ ] MongoDB Atlas connected
- [ ] CORS origins set to frontend URL
- [ ] SSL/TLS certificate installed
- [ ] `python manage.py check --deploy` passes
- [ ] InsightFace models pre-downloaded
- [ ] Superuser created
- [ ] Static files collected
- [ ] Gunicorn/systemd service running
- [ ] Nginx reverse proxy configured

### Frontend
- [ ] `VITE_API_BASE_URL` points to production API
- [ ] Google Client ID configured (if using OAuth)
- [ ] `npm run build` successful
- [ ] Deployed to hosting platform
- [ ] HTTPS enabled
- [ ] DNS configured

### Testing
- [ ] Login/register works
- [ ] Google OAuth works (if enabled)
- [ ] Face enrollment works
- [ ] Face recognition works
- [ ] Check-in/out works
- [ ] Dashboard loads
- [ ] Admin features work
- [ ] No console errors

### Security
- [ ] All environment variables in `.env` files
- [ ] `.env` files in `.gitignore`
- [ ] MongoDB IP whitelist configured
- [ ] Rate limiting tested
- [ ] JWT tokens expiring correctly

---

## 🎉 Deployment Complete!

Your Face Recognition Attendance System is now live and ready to use.

For ongoing support and updates, refer to the documentation files in the repository.

**Monitoring Recommendations:**
- Check logs daily for first week
- Monitor MongoDB Atlas metrics
- Set up error tracking (Sentry)
- Schedule regular backups
- Keep dependencies updated

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅
