# Face Attendance System - Backend

Django REST Framework backend with MongoDB and Machine Learning-based face recognition using InsightFace.

## Tech Stack

- **Django 5.0** - Web framework
- **Django REST Framework** - REST API
- **MongoDB Atlas** - Database (using `django-mongodb-backend`)
- **Simple JWT** - JWT authentication
- **InsightFace** - Pretrained face recognition (buffalo_l model)
- **OpenCV** - Image processing
- **Python 3.10+** - Programming language

## Project Structure

```
backend/
├── config/                 # Django project configuration
│   ├── settings.py         # Django settings
│   ├── urls.py             # URL routing
│   ├── wsgi.py             # WSGI configuration
│   └── asgi.py             # ASGI configuration
├── apps/                   # Django applications
│   ├── accounts/           # User authentication & management
│   ├── employees/          # Employee management
│   ├── attendance/         # Attendance tracking
│   ├── recognition/        # Face recognition API
│   └── dashboard/          # Dashboard statistics
├── ml/                     # Machine Learning components
│   ├── models/             # ML model files (downloaded at runtime)
│   ├── face_detector.py    # Face detection (InsightFace SCRFD)
│   ├── face_recognizer.py  # Face recognition (buffalo_l)
│   ├── embedding_service.py # Face embedding generation
│   └── matching_service.py  # Face matching logic
├── media/                  # User-uploaded files
├── manage.py               # Django management script
├── requirements.txt        # Python dependencies
└── .env                    # Environment variables
```

## Important: MongoDB Backend

This project uses **django-mongodb-backend**, which is currently a **public preview technology** from MongoDB. This is an experimental backend that may have limitations compared to the standard PostgreSQL/MySQL backends.

**Known considerations:**
- Some Django ORM features may not be fully supported
- Production use should be carefully evaluated
- Monitor MongoDB's official updates for stability improvements

## Setup

### 1. Create Virtual Environment

Windows:
```bash
python -m venv venv
venv\Scripts\activate
```

Linux/Mac:
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create `.env` file:
```bash
cp .env.example .env
```

Update the following in `.env`:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=face_attendance
```

### 4. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 6. Run Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/me/` - Get current user

### Employees
- `GET /api/employees/` - List employees
- `POST /api/employees/` - Create employee
- `GET /api/employees/{id}/` - Get employee details
- `PATCH /api/employees/{id}/` - Update employee
- `DELETE /api/employees/{id}/` - Delete employee

### Face Recognition
- `POST /api/face/register/` - Register employee face
- `POST /api/face/recognize/` - Recognize face and mark attendance

### Attendance
- `GET /api/attendance/` - List attendance records
- `GET /api/attendance/{id}/` - Get attendance details
- `POST /api/attendance/check-in/` - Manual check-in
- `POST /api/attendance/check-out/` - Manual check-out

### Dashboard
- `GET /api/dashboard/admin/` - Admin dashboard statistics
- `GET /api/dashboard/employee/` - Employee dashboard statistics

## Face Recognition System

### Architecture

This system uses **pretrained models** from InsightFace, specifically:

1. **Face Detection**: InsightFace SCRFD detector
2. **Face Recognition**: InsightFace buffalo_l model pack

### Important Notes

- **No custom training**: The system uses pretrained deep learning models
- **Embeddings**: Numerical representations of faces for comparison
- **Threshold-based matching**: Configurable similarity threshold for recognition
- **Security**: Biometric embeddings are protected and not exposed via API

### ML Pipeline

```
Image → Face Detection → Face Alignment → Embedding Generation → 
→ Similarity Comparison → Identity Match → Attendance Recording
```

### Configuration

Face recognition settings in `.env`:
```env
FACE_RECOGNITION_THRESHOLD=0.4    # Lower = stricter matching
FACE_DETECTION_CONFIDENCE=0.5     # Face detection confidence
```

## User Roles

- **ADMIN**: Full system access, employee management, reports
- **EMPLOYEE**: Personal dashboard, face registration, attendance

## Security

- JWT-based authentication
- Role-based access control
- Password hashing (Django default)
- Biometric data protection
- CORS configuration
- Environment-based secrets

## Development Workflow

1. Activate virtual environment
2. Make code changes
3. Create/update migrations: `python manage.py makemigrations`
4. Apply migrations: `python manage.py migrate`
5. Run server: `python manage.py runserver`
6. Test API endpoints

## Testing

Run Django tests:
```bash
python manage.py test
```

## Phase Completion

✅ Phase 1: Project setup complete
- Django project created
- MongoDB configured with django-mongodb-backend
- Apps structure created (accounts, employees, attendance, recognition, dashboard)
- ML directory structure ready
- Environment variables configured
- Requirements.txt with all dependencies

## Next Steps

- Phase 2: Frontend Design System
- Phase 3: Authentication Backend (JWT, User model, Login/Register)
- Phase 9: InsightFace ML Environment Setup
