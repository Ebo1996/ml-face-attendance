# Face Recognition Attendance System

A comprehensive **Machine Learning-Based Employee Face Recognition Attendance System** built with React, Django REST Framework, MongoDB Atlas, OpenCV, and InsightFace.

The system uses a **pretrained deep-learning face recognition model** (InsightFace buffalo_l) to generate facial embeddings, compare employee faces, identify authorized employees, and automatically record attendance.

## 🎯 Project Overview

This is a modern, full-stack HR attendance platform that enables:

### Employee Features
- User registration and authentication
- Personal dashboard with attendance statistics
- Profile management
- Face registration for biometric attendance
- Face recognition-based attendance marking
- Attendance history and analytics

### Admin Features
- Comprehensive admin dashboard
- Employee management (CRUD operations)
- Face recognition interface for marking attendance
- Advanced attendance management and filtering
- Reports and data export (CSV)
- Company-wide analytics

## 🏗️ Architecture

```
┌───────────────────────────────┐
│    React + TypeScript         │
│    Frontend (Port 3000)       │
│                               │
│  • Dashboard                  │
│  • Employee Management        │
│  • Attendance                 │
│  • Camera Interface           │
│  • Authentication             │
└───────────────┬───────────────┘
                │
           REST API (JSON)
                │
┌───────────────▼───────────────┐
│    Django REST Framework      │
│    Backend (Port 8000)        │
│                               │
│  • JWT Authentication         │
│  • Employee APIs              │
│  • Attendance APIs            │
│  • Face Recognition APIs      │
│  • Dashboard APIs             │
└───────────────┬───────────────┘
                │
       ┌────────┴────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌───────────────┐
│ InsightFace │   │ MongoDB Atlas │
│             │   │               │
│ • SCRFD     │   │ • Users       │
│   Detector  │   │ • Employees   │
│ • buffalo_l │   │ • Attendance  │
│   Model     │   │ • Embeddings  │
│ • Embeddings│   │               │
└─────────────┘   └───────────────┘
       │
       ▼
  Face Recognition
  & Matching Engine
```

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **TanStack Query** - Server state management
- **React Hook Form** + **Zod** - Form handling & validation
- **Recharts** - Data visualization
- **Lucide React** - Icons

### Backend
- **Python 3.10+**
- **Django 5.0** - Web framework
- **Django REST Framework** - RESTful APIs
- **Simple JWT** - JWT authentication
- **MongoDB Atlas** - NoSQL database
- **django-mongodb-backend** - MongoDB integration (⚠️ public preview)

### Machine Learning
- **InsightFace** - Pretrained face recognition (buffalo_l model)
- **OpenCV** - Image processing and preprocessing
- **ONNX Runtime** - Model inference
- **NumPy** - Numerical operations

## 📁 Project Structure

```
face-attendance-system/
│
├── frontend/                # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── layouts/         # Layout wrappers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── context/         # React context
│   │   ├── types/           # TypeScript types
│   │   ├── routes/          # Route configuration
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── README.md
│
├── backend/                 # Django REST Framework backend
│   ├── config/              # Django configuration
│   ├── apps/                # Django applications
│   │   ├── accounts/        # Authentication
│   │   ├── employees/       # Employee management
│   │   ├── attendance/      # Attendance tracking
│   │   ├── recognition/     # Face recognition
│   │   └── dashboard/       # Analytics
│   ├── ml/                  # ML components
│   │   ├── models/          # Model files
│   │   ├── face_detector.py
│   │   ├── face_recognizer.py
│   │   ├── embedding_service.py
│   │   └── matching_service.py
│   ├── requirements.txt
│   └── README.md
│
├── .gitignore
└── README.md                # This file
```

## 🔧 Setup Instructions

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.10+
- **MongoDB Atlas** account
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd face-attendance-system
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB credentials

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start backend server
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Update VITE_API_BASE_URL if needed

# Start frontend development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

## 🔐 User Roles

### EMPLOYEE Role
- View personal dashboard
- Manage own profile
- Register face biometrics
- Mark attendance via face recognition
- View own attendance history

### ADMIN Role
- Access admin dashboard with company-wide stats
- Manage all employees
- Use face recognition to mark attendance for any employee
- View and filter all attendance records
- Generate reports

## 🤖 Face Recognition System

### How It Works

1. **Face Enrollment**
   - Employee captures face image via camera
   - Backend detects face using InsightFace SCRFD
   - Validates face quality and uniqueness
   - Generates numerical face embedding (512-dimensional vector)
   - Securely stores embedding linked to employee

2. **Face Recognition**
   - Employee/Admin captures image
   - System detects and extracts face
   - Generates embedding from detected face
   - Compares against enrolled embeddings using cosine similarity
   - If similarity > threshold: identity confirmed
   - Records attendance with timestamp

3. **Security & Privacy**
   - Face embeddings are numerical vectors, not images
   - Embeddings stored securely in MongoDB
   - Never exposed through API responses
   - Access control enforced at API level

### Model Information

- **Detection**: InsightFace SCRFD (trained on WIDER FACE dataset)
- **Recognition**: InsightFace buffalo_l model pack
- **No custom training**: Uses pretrained models optimized for accuracy
- **Embedding size**: 512 dimensions
- **Threshold**: Configurable (default 0.4)

### Recognition Pipeline

```
Camera Capture
    ↓
OpenCV Preprocessing
    ↓
Face Detection (SCRFD)
    ↓
Face Alignment
    ↓
Embedding Generation (buffalo_l)
    ↓
Similarity Comparison (Cosine)
    ↓
Threshold Check
    ↓
Identity Decision
    ↓
Attendance Recording
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/me/` - Current user info

### Employees
- `GET /api/employees/` - List employees (paginated)
- `POST /api/employees/` - Create employee (admin)
- `GET /api/employees/{id}/` - Employee details
- `PATCH /api/employees/{id}/` - Update employee
- `DELETE /api/employees/{id}/` - Delete employee (admin)

### Face Recognition
- `POST /api/face/register/` - Register employee face
- `POST /api/face/recognize/` - Recognize face & mark attendance

### Attendance
- `GET /api/attendance/` - List attendance (filtered)
- `GET /api/attendance/{id}/` - Attendance details
- `POST /api/attendance/check-in/` - Manual check-in
- `POST /api/attendance/check-out/` - Manual check-out

### Dashboard
- `GET /api/dashboard/admin/` - Admin statistics
- `GET /api/dashboard/employee/` - Employee statistics

## ⚠️ Important Notes

### MongoDB Backend (Public Preview)

This project uses **django-mongodb-backend**, which is currently in **public preview**. This means:

- ✅ Suitable for development and testing
- ⚠️ Some Django ORM features may have limitations
- ⚠️ Production deployment requires careful evaluation
- 📖 Monitor official MongoDB documentation for updates

### Face Recognition Ethics

- This system is designed for legitimate employee attendance use
- Obtain proper consent before collecting biometric data
- Comply with local data protection regulations (GDPR, etc.)
- Implement appropriate data retention policies
- Provide opt-out mechanisms where legally required

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🚀 Production Deployment

### Backend
- Use `gunicorn` or `uwsgi` as WSGI server
- Set `DEBUG=False`
- Use strong `SECRET_KEY`
- Configure proper `ALLOWED_HOSTS`
- Use environment variables for secrets
- Enable HTTPS
- Set up proper logging

### Frontend
```bash
npm run build
# Serve the dist/ folder with nginx or similar
```

### Database
- Use MongoDB Atlas production cluster
- Enable authentication
- Configure IP whitelisting
- Set up backups
- Monitor performance

## 📈 Development Phases

This project was built in 28 structured phases:

✅ **Phase 1**: Project Setup (Frontend + Backend)  
⏳ **Phase 2**: Frontend Design System  
⏳ **Phase 3**: Authentication Backend  
⏳ **Phase 4**: Authentication Frontend  
... (continues through Phase 28)

See individual README files in `frontend/` and `backend/` for phase details.

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## 📄 License

[Your License Here]

## 🙏 Acknowledgments

- **InsightFace** - Pretrained face recognition models
- **OpenCV** - Computer vision library
- **MongoDB** - Database platform
- Design inspired by modern HR SaaS platforms

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check documentation in `/frontend/README.md` and `/backend/README.md`

---

**Built with ❤️ using React, Django, MongoDB, and InsightFace**

**Current Status**: Phase 1 Complete ✅
