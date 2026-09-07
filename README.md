# Face Recognition Attendance System

A full-stack attendance management system that uses real-time face recognition to automate employee check-in and check-out. Built with Django REST Framework, React, and InsightFace buffalo_l.

**Status: 28 / 28 phases complete ✅**

---

## Overview

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, TanStack Query |
| Backend | Django 5, Django REST Framework, Simple JWT |
| Database | MongoDB Atlas via `django-mongodb-backend` |
| Face detection | InsightFace SCRFD (`det_10g.onnx`) |
| Face recognition | InsightFace buffalo_l ArcFace ResNet-50 (`w600k_r50.onnx`) |
| ML inference | ONNX Runtime (CPU / CUDA) |
| Testing | Django TestCase (58 tests) · Vitest (30 tests) |

---

## Features

- **Face recognition check-in / check-out** — 1:N identification against enrolled employees
- **Admin dashboard** — company-wide attendance stats, 14-day trend chart, monthly breakdown
- **Employee dashboard** — personal attendance status, calendar, history
- **Employee management** — CRUD with department, position, and role filters
- **Admin attendance management** — manual overrides, date-range filters, CSV export
- **Face enrollment** — guided camera capture, multi-angle storage
- **JWT authentication** — access + refresh tokens with automatic rotation
- **Rate limiting** — 10 req/min for auth, 20 req/min for face endpoints
- **WCAG 2.1 AA accessibility** — ARIA attributes, keyboard navigation, focus trap
- **Fully responsive** — mobile-first Tailwind CSS layout

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB Atlas cluster (free tier works)

### 1. Clone and configure

```bash
git clone <repo-url>
cd face-attendance-system

# Root env (optional — each sub-directory has its own)
cp .env.example .env
```

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set MONGODB_URI and SECRET_KEY

# Apply migrations
python manage.py migrate

# Create a superuser (optional)
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

The API is available at `http://localhost:8000/api`.

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — VITE_API_BASE_URL defaults to http://localhost:8000/api

# Run development server
npm run dev
```

The UI is available at `http://localhost:3000`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | ✅ | Django secret key (50+ random chars) |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `MONGODB_DATABASE` | ✅ | Database name (`face_attendance`) |
| `DEBUG` | ✅ | `True` for dev, `False` for production |
| `ALLOWED_HOSTS` | ✅ | Comma-separated hostnames |
| `CORS_ALLOWED_ORIGINS` | ✅ | Frontend origins (e.g. `http://localhost:3000`) |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | — | Default: `60` |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | — | Default: `7` |
| `FACE_VERIFICATION_THRESHOLD` | — | Default: `0.60` (higher = stricter) |
| `FACE_IDENTIFICATION_THRESHOLD` | — | Default: `0.55` |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | Backend API base URL |

---

## Project Structure

```
.
├── backend/
│   ├── apps/
│   │   ├── accounts/       # Custom User model, JWT auth views
│   │   ├── employees/      # Employee profiles, CRUD
│   │   ├── attendance/     # Records, check-in/out service, stats
│   │   ├── recognition/    # Face register & recognize endpoints
│   │   ├── ml_service/     # FaceDetector, FaceRecognizer, embeddings
│   │   └── dashboard/      # Admin & employee dashboard stats
│   ├── config/             # Django settings, URLs, throttles
│   ├── ml/
│   │   └── evaluation/     # FAR/FRR/EER evaluation script + reports
│   ├── ML_ARCHITECTURE.md  # Full ML pipeline documentation
│   ├── SECURITY.md         # Security policies and controls
│   └── README.md           # Backend API reference
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level page components
│   │   ├── services/       # API client and service layer
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utilities (cn, imageOptimization)
│   ├── ACCESSIBILITY_REPORT.md
│   ├── PERFORMANCE_OPTIMIZATION_REPORT.md
│   ├── RESPONSIVE_DESIGN_REPORT.md
│   └── package.json
│
├── .env.example            # Root environment template
├── .gitignore
└── README.md               # This file
```

---

## API Reference

All endpoints are prefixed with `/api`. Full reference in [`backend/README.md`](backend/README.md).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register/` | — | Register new user |
| POST | `/auth/login/` | — | Login, receive JWT tokens |
| POST | `/auth/logout/` | ✅ | Blacklist refresh token |
| GET | `/auth/me/` | ✅ | Current user profile |
| POST | `/auth/refresh/` | — | Refresh access token |
| GET | `/employees/` | Admin | List all employees |
| GET | `/employees/<id>/` | ✅ | Employee detail |
| PATCH | `/employees/profile/` | ✅ | Update own profile |
| GET | `/employees/stats/` | Admin | Employee statistics |
| POST | `/face/register/` | Admin | Enroll face embedding |
| POST | `/face/recognize/` | ✅ | Identify face from image |
| POST | `/attendance/check-in/` | ✅ | Face-powered check-in |
| POST | `/attendance/check-out/` | ✅ | Face-powered check-out |
| GET | `/attendance/today/` | ✅ | Today's attendance status |
| GET | `/attendance/history/` | ✅ | Attendance history |
| GET | `/attendance/admin/today/` | Admin | Company today overview |
| GET | `/attendance/admin/monthly/` | Admin | Monthly stats |

---

## Running Tests

### Backend (Django)

```bash
cd backend
python manage.py test apps
```

Covers:
- `apps.accounts` — User model, serializers, auth endpoints (18 tests)
- `apps.employees` — EmployeeProfile model, endpoints, serializers (15 tests)
- `apps.attendance` — AttendanceRecord model, service logic with mocked face verification, endpoints (25 tests)

### Frontend (Vitest)

```bash
cd frontend
npm test
```

Covers:
- `utils/cn` — className merging utility (11 tests)
- `utils/imageOptimization` — compression, sizing, validation utilities (19 tests)

---

## ML Performance

Evaluated on synthetic test pairs (see [`backend/ml/evaluation/EVALUATION_REPORT.md`](backend/ml/evaluation/EVALUATION_REPORT.md)):

| Metric | Value |
|---|---|
| True Accept Rate (TAR) | 83.5% |
| False Accept Rate (FAR) | 0.0% |
| False Reject Rate (FRR) | 16.5% |
| Equal Error Rate (EER) | 0.38% |
| F1 Score | 0.91 |
| Per-comparison speed | < 1ms |

> ⚠️ Evaluated on synthetic embeddings. Real-world accuracy depends on dataset quality, lighting, and camera resolution. See [`backend/ML_ARCHITECTURE.md`](backend/ML_ARCHITECTURE.md) for production tuning guidance.

---

## Production Deployment

### Backend checklist

```bash
# 1. Set environment variables
DEBUG=False
SECRET_KEY=<50+ random chars>
ALLOWED_HOSTS=yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# 2. Collect static files
python manage.py collectstatic --noinput

# 3. Run system check
python manage.py check --deploy

# 4. Start with gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Frontend checklist

```bash
# 1. Set production API URL
VITE_API_BASE_URL=https://api.yourdomain.com/api

# 2. Build
npm run build

# 3. Serve dist/ with nginx or a CDN
# nginx example:
# location / {
#   root /var/www/face-attendance/dist;
#   try_files $uri $uri/ /index.html;
# }
```

### Security notes

- Rate limiting: 10 req/min for auth endpoints, 20 req/min for face endpoints
- JWT refresh tokens are blacklisted on logout
- Face embeddings are stored server-side only (never returned to client)
- See [`backend/SECURITY.md`](backend/SECURITY.md) for full security documentation

---

## Documentation Index

| Document | Location | Description |
|---|---|---|
| Backend API Reference | `backend/README.md` | All endpoints, models, setup |
| ML Architecture | `backend/ML_ARCHITECTURE.md` | Pipeline, models, thresholds |
| ML Evaluation Report | `backend/ml/evaluation/EVALUATION_REPORT.md` | FAR/FRR/EER metrics |
| Security Policy | `backend/SECURITY.md` | Rate limiting, auth, data handling |
| Accessibility Report | `frontend/ACCESSIBILITY_REPORT.md` | WCAG 2.1 AA compliance |
| Responsive Design | `frontend/RESPONSIVE_DESIGN_REPORT.md` | Breakpoints, mobile strategy |
| Performance Report | `frontend/PERFORMANCE_OPTIMIZATION_REPORT.md` | Compression, caching |

---

## 28-Phase Development Summary

| Phase | Description | Status |
|---|---|---|
| 1–8 | Project setup, design system, auth, employee CRUD | ✅ |
| 9–12 | ML environment, face enrollment, matching, recognition | ✅ |
| 13–19 | Attendance backend/frontend, admin pages, CSV export | ✅ |
| 20 | Security hardening (rate limits, CORS, token blacklist) | ✅ |
| 21 | ML evaluation (FAR/FRR/EER, latency benchmarks) | ✅ |
| 22 | ML documentation rewrite | ✅ |
| 23 | Accessibility (ARIA, keyboard nav, WCAG 2.1 AA) | ✅ |
| 24 | Responsive design verification | ✅ |
| 25 | Performance (image compression, query caching) | ✅ |
| 26 | Testing (58 Django + 30 Vitest) | ✅ |
| 27 | Final UI polish (dead code, console.log sweep) | ✅ |
| 28 | Production readiness (build verified, docs complete) | ✅ |

---

## License

MIT
