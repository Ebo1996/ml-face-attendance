# 🚀 Production Deployment Guide

Complete guide for deploying the Face Recognition Attendance System to production.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Options](#deployment-options)
  - [Option 1: Docker Deployment (Recommended)](#option-1-docker-deployment-recommended)
  - [Option 2: Manual VPS Deployment](#option-2-manual-vps-deployment)
  - [Option 3: Cloud Platform Deployment](#option-3-cloud-platform-deployment)
- [Post-Deployment](#post-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

1. **MongoDB Atlas Account** (Free tier available)
   - Sign up at: https://cloud.mongodb.com/
   - Create a cluster and get connection string

2. **Domain Name** (Recommended)
   - Purchase from: Namecheap, GoDaddy, CloudFlare, etc.
   - Point DNS A records to your server IP

3. **Google OAuth Credentials**
   - Create project at: https://console.cloud.google.com/
   - Configure OAuth consent screen
   - Create OAuth 2.0 Client ID credentials
   - Add authorized origins and redirect URIs

### Server Requirements

**Minimum Specifications:**
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Storage:** 20 GB SSD
- **OS:** Ubuntu 22.04 LTS (recommended)
- **Network:** Public IP address, ports 80 & 443 open

**Recommended Specifications:**
- **CPU:** 4 cores
- **RAM:** 8 GB
- **Storage:** 50 GB SSD

### Software Requirements

- Docker 24.0+ and Docker Compose 2.0+
- Git
- SSL certificate (Let's Encrypt recommended)

---

## Pre-Deployment Checklist

### ✅ Security Checklist

- [ ] Generated new `SECRET_KEY` for Django
- [ ] Created `.env.production` files with real credentials (NOT committed to Git)
- [ ] Changed default MongoDB credentials
- [ ] Configured production Google OAuth credentials
- [ ] Set `DEBUG=False` in production environment
- [ ] Configured `ALLOWED_HOSTS` with your domain
- [ ] Obtained SSL certificate for HTTPS
- [ ] Reviewed and configured firewall rules
- [ ] Set up SSH key authentication (disabled password login)
- [ ] Configured fail2ban for brute force protection

### ✅ Configuration Checklist

- [ ] Updated `CORS_ALLOWED_ORIGINS` with production URLs
- [ ] Configured SMTP for email notifications (optional)
- [ ] Set up backup strategy for MongoDB
- [ ] Configured error monitoring (Sentry, optional)
- [ ] Reviewed rate limiting settings
- [ ] Tested Google OAuth with production credentials

---

## Deployment Options

## Option 1: Docker Deployment (Recommended)

### Step 1: Prepare the Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install other tools
sudo apt install git certbot -y

# Reboot or re-login for Docker group to take effect
sudo reboot
```

### Step 2: Clone Repository

```bash
# Clone your repository
git clone https://github.com/Ebo1996/face-attendance-system.git
cd face-attendance-system
```

### Step 3: Configure Environment Variables

```bash
# Backend production environment
cp backend/.env.production.example backend/.env.production
nano backend/.env.production
```

**Fill in the following values:**

```env
SECRET_KEY=<generate-with-get_random_secret_key>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=face_attendance_prod

JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
```

```bash
# Frontend production environment
cp frontend/.env.production.example frontend/.env.production
nano frontend/.env.production
```

**Fill in:**

```env
VITE_API_BASE_URL=https://yourdomain.com/api
VITE_GOOGLE_CLIENT_ID=your-production-google-client-id.apps.googleusercontent.com
```

### Step 4: Obtain SSL Certificate

#### Using Let's Encrypt (Recommended)

```bash
# Stop services if running
docker compose down

# Obtain certificate
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive

# Copy certificates to project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
sudo chown $USER:$USER nginx/ssl/*.pem
chmod 644 nginx/ssl/fullchain.pem
chmod 600 nginx/ssl/privkey.pem
```

#### Certificate Auto-Renewal

```bash
# Add to crontab
crontab -e

# Add this line (runs daily at 3 AM)
0 3 * * * sudo certbot renew --quiet --deploy-hook "docker compose -f /path/to/face-attendance-system/docker-compose.yml restart nginx"
```

### Step 5: Update Nginx Configuration

```bash
# Edit nginx configuration with your domain
nano nginx/conf.d/face-attendance.conf

# Replace "yourdomain.com" with your actual domain
# Do this in both HTTP and HTTPS server blocks
```

### Step 6: Build and Deploy

```bash
# Build images
docker compose build

# Start services
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps
```

### Step 7: Initialize Database

```bash
# Run migrations
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Test the application
curl https://yourdomain.com/api/health/
```

### Step 8: Verify Deployment

1. **Visit your domain:** https://yourdomain.com
2. **Test registration:** Create a new account
3. **Test Google OAuth:** Login with Google
4. **Test face enrollment:** Register face
5. **Test attendance:** Mark attendance
6. **Access admin panel:** https://yourdomain.com/admin/

---

## Option 2: Manual VPS Deployment

### Step 1: Prepare Python Environment

```bash
# Install system dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install python3.11 python3.11-venv python3-pip nginx postgresql-14 redis-server -y

# Install OpenCV dependencies
sudo apt install libgl1-mesa-glx libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 2: Deploy Backend

```bash
# Clone repository
git clone https://github.com/Ebo1996/face-attendance-system.git
cd face-attendance-system/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Configure environment
cp .env.production.example .env.production
nano .env.production  # Fill in production values

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --no-input

# Create superuser
python manage.py createsuperuser

# Test server
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

### Step 3: Deploy Frontend

```bash
cd ../frontend

# Install dependencies
npm ci

# Build production bundle
npm run build

# Serve with nginx (configured in next step)
```

### Step 4: Configure Nginx

```bash
# Copy nginx configuration
sudo cp ../nginx/conf.d/face-attendance.conf /etc/nginx/sites-available/face-attendance
sudo ln -s /etc/nginx/sites-available/face-attendance /etc/nginx/sites-enabled/

# Edit paths and domain
sudo nano /etc/nginx/sites-available/face-attendance

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Step 5: Setup systemd Service

**Backend Service:**

```bash
sudo nano /etc/systemd/system/face-attendance-backend.service
```

```ini
[Unit]
Description=Face Attendance Backend
After=network.target

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/path/to/face-attendance-system/backend
Environment="PATH=/path/to/face-attendance-system/backend/venv/bin"
ExecStart=/path/to/face-attendance-system/backend/venv/bin/gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable face-attendance-backend
sudo systemctl start face-attendance-backend
sudo systemctl status face-attendance-backend
```

---

## Option 3: Cloud Platform Deployment

### AWS (Elastic Beanstalk + RDS)

1. **Create Elastic Beanstalk application**
2. **Set up RDS MongoDB instance** (or use MongoDB Atlas)
3. **Configure environment variables** in EB console
4. **Deploy using EB CLI:**

```bash
eb init
eb create production
eb deploy
```

### Google Cloud Platform (App Engine)

1. **Create app.yaml configuration**
2. **Deploy:**

```bash
gcloud app deploy
```

### Heroku

1. **Create Heroku apps:**

```bash
heroku create face-attendance-backend
heroku create face-attendance-frontend
```

2. **Set environment variables:**

```bash
heroku config:set SECRET_KEY=xxx -a face-attendance-backend
heroku config:set DEBUG=False -a face-attendance-backend
# ... set all variables
```

3. **Deploy:**

```bash
git push heroku main
```

### DigitalOcean App Platform

1. **Connect GitHub repository**
2. **Configure build settings** via web UI
3. **Set environment variables**
4. **Deploy with one click**

---

## Post-Deployment

### 1. Enable HTTPS Strict Transport Security (HSTS)

After confirming HTTPS works correctly:

```bash
# Edit nginx configuration
nano nginx/conf.d/face-attendance.conf

# Uncomment this line:
# add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Restart nginx
docker compose restart nginx
```

### 2. Setup Monitoring

**Install monitoring tools:**

```bash
# Prometheus + Grafana
docker run -d --name=prometheus -p 9090:9090 prom/prometheus
docker run -d --name=grafana -p 3001:3000 grafana/grafana
```

**Configure health checks:**

- Backend health: `https://yourdomain.com/api/health/`
- Setup uptime monitoring: UptimeRobot, Pingdom, or StatusCake

### 3. Configure Backups

**MongoDB Atlas automatic backups:**
- Enable in Atlas console
- Configure backup frequency
- Test restore procedure

**Application files backup:**

```bash
# Backup script
#!/bin/bash
BACKUP_DIR="/backups/face-attendance-$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup volumes
docker run --rm -v face-attendance_backend_media:/data \
  -v $BACKUP_DIR:/backup alpine \
  tar czf /backup/media.tar.gz -C /data .

docker run --rm -v face-attendance_ml_models:/data \
  -v $BACKUP_DIR:/backup alpine \
  tar czf /backup/models.tar.gz -C /data .

# Upload to cloud storage (S3, Google Cloud Storage, etc.)
```

### 4. Setup Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/face-attendance

# Add:
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  delaycompress
  missingok
  notifempty
}
```

### 5. Configure Fail2Ban

```bash
# Install fail2ban
sudo apt install fail2ban -y

# Create custom jail
sudo nano /etc/fail2ban/jail.d/nginx-limit.conf
```

```ini
[nginx-limit]
enabled = true
filter = nginx-limit
logpath = /var/log/nginx/error.log
maxretry = 5
findtime = 600
bantime = 3600
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check all services
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx

# Check resource usage
docker stats
```

### Performance Monitoring

**Key metrics to monitor:**

- Response time (API endpoints)
- Database query performance
- Memory usage
- CPU usage
- Disk space
- Face recognition processing time
- Error rates

**Recommended tools:**

- **Sentry** - Error tracking
- **New Relic** - APM
- **DataDog** - Infrastructure monitoring
- **Prometheus + Grafana** - Metrics visualization

### Regular Maintenance Tasks

**Daily:**
- Review error logs
- Check disk space
- Monitor response times

**Weekly:**
- Review security logs
- Check SSL certificate expiry
- Update dependencies (patch releases)

**Monthly:**
- Database cleanup/optimization
- Review user activity logs
- Update system packages
- Test backup restoration

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker compose build

# Apply migrations
docker compose exec backend python manage.py migrate

# Restart services
docker compose up -d

# Verify deployment
docker compose ps
curl https://yourdomain.com/api/health/
```

---

## Troubleshooting

### Common Issues

#### 1. SSL Certificate Errors

**Symptom:** Browser shows "Not Secure" warning

**Solutions:**
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/fullchain.pem -text -noout

# Renew certificate
sudo certbot renew

# Restart nginx
docker compose restart nginx
```

#### 2. 502 Bad Gateway

**Symptom:** Nginx returns 502 error

**Solutions:**
```bash
# Check backend status
docker compose ps backend

# View backend logs
docker compose logs backend

# Restart backend
docker compose restart backend

# Check MongoDB connection
docker compose exec backend python manage.py dbshell
```

#### 3. Face Recognition Not Working

**Symptom:** Face enrollment/recognition fails

**Solutions:**
```bash
# Check ML models downloaded
docker compose exec backend ls -la ml/models/

# Check logs for model errors
docker compose logs backend | grep -i "insightface\|onnx"

# Restart backend (models download on first request)
docker compose restart backend

# Check disk space
df -h
```

#### 4. High Memory Usage

**Symptom:** Server running out of memory

**Solutions:**
```bash
# Check memory usage
docker stats

# Reduce Gunicorn workers in Dockerfile
# Change: --workers 4 to --workers 2

# Restart with resource limits
docker compose down
docker compose up -d
```

#### 5. Database Connection Errors

**Symptom:** "ServerSelectionTimeoutError"

**Solutions:**
```bash
# Check MongoDB URI in .env.production
cat backend/.env.production | grep MONGODB_URI

# Test connection
docker compose exec backend python -c "from pymongo import MongoClient; client = MongoClient('your-uri'); print(client.server_info())"

# Check MongoDB Atlas IP whitelist
# Add server IP to Atlas Network Access
```

### Getting Help

- **GitHub Issues:** https://github.com/Ebo1996/face-attendance-system/issues
- **Documentation:** Check README.md and API docs
- **Logs:** Always include relevant log output when asking for help

---

## Security Best Practices

1. **Never commit `.env.production` files** to version control
2. **Use strong passwords** for all services (20+ characters)
3. **Enable 2FA** on cloud accounts (AWS, MongoDB Atlas, etc.)
4. **Keep dependencies updated** - run `pip-audit` regularly
5. **Use secrets management** (AWS Secrets Manager, HashiCorp Vault)
6. **Enable firewall** - only allow ports 80, 443, and SSH
7. **Disable root SSH login** - use key-based authentication only
8. **Regular security audits** - run `docker scan` on images
9. **Monitor failed login attempts** with fail2ban
10. **Backup encryption** - encrypt backups before cloud storage

---

## Performance Optimization

### 1. Enable Redis Caching

```bash
# Add to docker-compose.yml
redis:
  image: redis:alpine
  restart: unless-stopped
```

### 2. Use CDN for Static Files

- Upload static files to CloudFlare, AWS CloudFront, or similar
- Update STATIC_URL in settings.py

### 3. Database Indexing

Ensure MongoDB indexes are created:

```python
# In Django shell
from apps.attendance.models import Attendance
Attendance.objects.create_indexes()
```

### 4. Enable HTTP/2

Already enabled in nginx configuration

### 5. Optimize Docker Images

- Use multi-stage builds (already implemented)
- Minimize layers
- Use alpine base images where possible

---

## Compliance & Legal

### GDPR Compliance (if applicable)

- Implement data deletion on user request
- Add privacy policy and terms of service
- Obtain explicit consent for face data collection
- Implement data export functionality
- Add cookie consent banner

### Face Recognition Ethics

- Inform users about face data collection
- Provide opt-out mechanism
- Never store actual face images (only embeddings)
- Implement data retention policies
- Regular security audits

---

## Support

For production deployment support:

- **Email:** ebisaberhanu1996@gmail.com
- **GitHub:** [@Ebo1996](https://github.com/Ebo1996)

---

**Last Updated:** September 2026  
**Author:** Ebisa Berhanu (@Ebo1996)
