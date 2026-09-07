# Face Attendance System — Backend

Django REST Framework backend with MongoDB Atlas and ML-based face recognition using InsightFace buffalo_l.

**Status: 28/28 phases complete ✅**

> ⚠️ **MongoDB Backend Notice:** This project uses [`django-mongodb-backend`](https://github.com/mongodb-labs/django-mongodb-backend), which is currently a **public preview** technology. It is suitable for development and testing. Review the official MongoDB documentation before deploying to production.

---

## Tech Stack

| Component | Technology |
|---|---|
| Web framework | Django 5.x |
| REST API | Django REST Framework 3.14 |
| Authentication | Simple JWT |
| Database | MongoDB Atlas via `django-mongodb-backend` |
| Face detection | InsightFace SCRFD (det_10g.onnx) |
| Face recognition | InsightFace buffalo_l (w600k_r50.onnx, ArcFace ResNet-50) |
| Image processing | OpenCV |
| ML inference | ONNX Runtime (CPU / CUDA) |
| Numerical ops | NumPy, scikit-learn |
| Python | 3.10+ |

---

## Architecture

```
React Frontend
      │  REST API (JSON)
      ▼
Django REST Framework (Port 8000)
  ├── apps/accounts/      JWT auth, user model
  ├── apps/employees/     Employee CRUD
  ├── apps/attendance/    Attendance records + stats
  ├── apps/recognition/   POST /api/face/register|recognize
  ├── apps/dashboard/     Admin + employee dashboard stats
  └── apps/ml_service/    FaceDetector, FaceRecognizer, FaceEmbedding model
      │
      ├── InsightFace buffalo_l (pretrained)
      │     SCRFD detection → ArcFace embedding
      └── MongoDB Atlas
            Users, Employees, FaceEmbeddings, Attendance
```

---

## Project Structure

```
backend/
├── config/
│   ├── settings.py          # All Django settings (Phase 20: security hardening)
│   ├── urls.py              # Root URL routing
│   ├── throttles.py         # AuthRateThrottle, FaceRateThrottle (Phase 20)
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── accounts/            # User model, JWT login/register/me/logout
│   ├── employees/           # Employee CRUD, profile, stats
│   ├── attendance/          # Check-in/out, history, stats, CSV export
│   ├── recognition/         # /api/face/register/ and /api/face/recognize/
│   ├── ml_service/          # InsightFace wrappers, FaceEmbedding model, cache
│   └── dashboard/           # /api/dashboard/admin/ and /api/dashboard/employee/
├── ml/
│   ├── face_detector.py     # Facade over apps/ml_service/face_detector
│   ├── face_recognizer.py   # Facade over apps/ml_service/face_recognizer
│   ├── embedding_service.py # End-to-end image → 512-d embedding
│   ├── matching_service.py  # Verification + identification logic
│   └── evaluation/
│       ├── evaluate.py      # Phase 21: FAR/FRR/EER/AUC evaluation CLI
│       ├── evaluation_report.json
│       └── EVALUATION_REPORT.md
├── manage.py
├── requirements.txt
├── ML_ARCHITECTURE.md       # Full ML pipeline documentation
├── SECURITY.md              # Phase 20 security documentation
└── .env.example
```

---

## Setup

### 1. Virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

InsightFace downloads the buffalo_l model pack (~300 MB) on first use. It is saved to `~/.insightface/models/buffalo_l/`.

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — set SECRET_KEY, MONGODB_URI, MONGODB_DATABASE
```

Minimum required `.env`:
```env
SECRET_KEY=your-50-char-secret-key
DEBUG=True
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DATABASE=face_attendance
```

### 4. Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. (Optional) Create admin superuser

```bash
python manage.py createsuperuser
```

### 6. Start server

```bash
python manage.py runserver
```

API available at `http://localhost:8000`

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login, returns JWT tokens |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Current user info |
| POST | `/api/auth/logout/` | Blacklist refresh token |

### Employees
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/employees/` | List employees (admin) |
| POST | `/api/employees/` | Create employee (admin) |
| GET | `/api/employees/{id}/` | Employee detail |
| PATCH | `/api/employees/{id}/` | Update employee |
| DELETE | `/api/employees/{id}/` | Deactivate employee (admin) |
| PATCH | `/api/employees/profile/` | Update own profile |

### Face Recognition
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/face/register/` | Enroll own face |
| POST | `/api/face/recognize/` | Recognise face + mark attendance |
| GET | `/api/face/enrollment-stats/` | Own enrollment statistics |
| GET | `/api/face/my-embeddings/` | List own embeddings |
| DELETE | `/api/face/embeddings/{id}/` | Delete own embedding |

### Attendance
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/attendance/` | List records (scoped by role) |
| GET | `/api/attendance/{id}/` | Single record |
| POST | `/api/attendance/check-in/` | Face-based check-in |
| POST | `/api/attendance/check-out/` | Face-based check-out |
| GET | `/api/attendance/today/` | Today's status |
| GET | `/api/attendance/my-stats/monthly/` | Monthly stats |
| GET | `/api/attendance/my-stats/weekly/` | Weekly stats |
| GET | `/api/attendance/my-stats/summary/` | Dashboard summary |
| GET | `/api/attendance/admin/list/` | Paginated admin list |
| GET | `/api/attendance/admin/stats/daily/` | Company daily stats |
| GET | `/api/attendance/admin/stats/monthly/` | Company monthly stats |
| GET | `/api/attendance/admin/stats/recent/` | Last N days trend |
| GET | `/api/attendance/export/my/` | Employee CSV export |
| GET | `/api/attendance/export/admin/` | Admin CSV export |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/admin/` | Admin dashboard stats |
| GET | `/api/dashboard/employee/` | Employee dashboard stats |

---

## Security

Rate limits (Phase 20):
- Anonymous: 30 requests/minute
- Authenticated: 300 requests/minute
- Auth endpoints (login/register): 10 requests/minute
- Face endpoints (register/recognize): 20 requests/minute

See `SECURITY.md` for the full security review.

---

## ML Documentation

See `ML_ARCHITECTURE.md` for:
- Complete recognition pipeline diagram
- Model specifications and input/output shapes
- Threshold documentation and guidance
- Embedding cache design
- Biometric data handling rules

---

## Evaluation

```bash
# Run ML evaluation (Phase 21)
python ml/evaluation/evaluate.py

# Custom threshold
python ml/evaluation/evaluate.py --threshold 0.65

# Save JSON report
python ml/evaluation/evaluate.py --output ml/evaluation/evaluation_report.json
```

Results summary (synthetic pairs): TAR 83.5%, FAR 0.0%, EER 0.38%, AUC 1.0, F1 0.91.

See `ml/evaluation/EVALUATION_REPORT.md` for full analysis and production guidance.

---

## Testing

```bash
# Django test suite (Phase 26)
python manage.py test apps

# Individual test scripts
python test_auth.py
python test_employees.py
python test_attendance.py
python test_face_enrollment.py
python test_face_matching.py
```

---

## Production Checklist

- [ ] `DEBUG=False` in `.env`
- [ ] Strong `SECRET_KEY` (50+ random characters)
- [ ] `ALLOWED_HOSTS` set to your domain
- [ ] MongoDB Atlas: production cluster, IP whitelist, auth enabled
- [ ] HTTPS configured (nginx/caddy with TLS)
- [ ] `python manage.py check --deploy` passes
- [ ] Run with gunicorn: `gunicorn config.wsgi:application`
- [ ] Static files: `python manage.py collectstatic`
- [ ] Review `SECURITY.md` biometric data obligations

---

## Phase Completion

| Phase | Description | Key Deliverables | Status |
|---|---|---|---|
| 1 | Project setup | Django + React scaffold, MongoDB config, env files | ✅ |
| 2 | Frontend design system | Tailwind, Button, Input, Card, Badge, Modal, Avatar | ✅ |
| 3 | Authentication backend | JWT login/register/refresh/logout, custom User model | ✅ |
| 4 | Authentication frontend | LoginPage, RegisterPage, AuthContext, protected routes | ✅ |
| 5 | Employee dashboard | EmployeeDashboard with attendance stats | ✅ |
| 6 | Employee profile | ProfilePage, ProfileEditForm, SecuritySettings | ✅ |
| 7 | Employee management backend | CRUD API, EmployeeProfile, stats endpoint | ✅ |
| 8 | Employee management frontend | EmployeeManagementPage, search/filter, table | ✅ |
| 9 | InsightFace ML environment | InsightFace buffalo_l, SCRFD, ONNX Runtime | ✅ |
| 10 | Face enrollment | FaceEnrollmentPage, CameraCapture, enrollment API | ✅ |
| 11 | Face matching engine | FaceMatchingService, EmbeddingCache, 1:N identification | ✅ |
| 12 | Attendance recognition | POST /face/register & /recognize, similarity threshold | ✅ |
| 13 | Attendance backend | AttendanceRecord model, check-in/out service, stats | ✅ |
| 14 | Employee attendance frontend | AttendancePage, check-in/out UI, calendar view | ✅ |
| 15 | Admin dashboard | AdminDashboard, 14-day trend chart, monthly stats | ✅ |
| 16 | Admin recognition | AdminRecognitionPage, live face detection | ✅ |
| 17 | Admin attendance management | AttendanceManagementPage, manual override, filters | ✅ |
| 18 | Dashboard API integration | TanStack Query integration, real-time data | ✅ |
| 19 | Reports / CSV export | Attendance export, date-range filters | ✅ |
| 20 | Security hardening | Rate limiting (auth/face), CORS headers, SECURITY.md | ✅ |
| 21 | ML evaluation | FAR/FRR/EER/AUC script, TAR=83.5%, EVALUATION_REPORT.md | ✅ |
| 22 | ML documentation | ML_ARCHITECTURE.md rewrite, backend README rewrite | ✅ |
| 23 | Accessibility | ARIA attributes, focus trap, keyboard nav, WCAG 2.1 AA | ✅ |
| 24 | Responsive design | Mobile-first verified, overflow-x-auto tables, sidebar | ✅ |
| 25 | Performance | Image compression (800×600, q=0.85), Query staleTime 30s | ✅ |
| 26 | Testing | Django TestCase suite (58 tests), Vitest frontend (30 tests) | ✅ |
| 27 | Final UI polish | Console.log sweep, dead code removed, real navigation | ✅ |
| 28 | Production readiness | Build verified, .env.example complete, deploy guide | ✅ |
