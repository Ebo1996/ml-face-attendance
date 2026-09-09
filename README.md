# Face Recognition Attendance System

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![Django](https://img.shields.io/badge/django-5.2+-green.svg)
![React](https://img.shields.io/badge/react-18.2-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.2-blue.svg)
![MongoDB](https://img.shields.io/badge/mongodb-atlas-green.svg)

**A modern, AI-powered attendance management system with real-time face recognition**

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Documentation](#documentation) • [License](#license)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)
- [Acknowledgments](#acknowledgments)

---

## 🌟 Overview

Face Recognition Attendance System is a comprehensive, enterprise-grade solution for automated employee attendance management. Built with cutting-edge face recognition technology powered by InsightFace's ArcFace model, this system eliminates manual attendance tracking and provides real-time insights into workforce presence.

### Why This System?

- **No More Buddy Punching**: Biometric authentication ensures only the actual employee can mark attendance
- **Touchless & Hygienic**: Perfect for post-pandemic workplace safety requirements
- **Real-time Analytics**: Instant visibility into attendance patterns and trends
- **Scalable Architecture**: Handles organizations from startups to enterprises
- **Modern UI/UX**: Intuitive interface that requires minimal training

---

## ✨ Features

### 🎯 Core Functionality

- **Face Recognition Check-In/Out**
  - Real-time 1:N identification against enrolled employees
  - Sub-second processing time
  - 99.3% accuracy with InsightFace buffalo_l model
  - Automatic status assignment (Present, Late, Half-Day)

- **Smart Face Enrollment**
  - Multi-angle face capture via webcam
  - Quality score validation
  - Duplicate detection
  - Primary face selection

- **Comprehensive Dashboards**
  - Admin: Company-wide attendance stats, 14-day trends, monthly breakdown
  - Employee: Personal attendance status, calendar view, work hours tracking
  - Real-time updates with TanStack Query

### 👥 User Management

- **Role-Based Access Control**
  - Admin: Full system access, employee management, manual overrides
  - Employee: Personal dashboard, face registration, attendance marking

- **Employee Management**
  - Complete CRUD operations
  - Department and position tracking
  - Search and filter capabilities
  - Bulk operations support

- **Profile Management**
  - Avatar upload with preview
  - Personal information updates
  - Password change with validation
  - Activity history

### 📊 Reporting & Analytics

- **Advanced Reports**
  - CSV export with date range filters
  - Status-based filtering
  - Employee-specific reports
  - Bulk company-wide exports (max 5,000 records)

- **Statistical Insights**
  - Attendance rate calculations
  - Work hours tracking
  - On-time streak monitoring
  - Department-wise breakdown

### 🔐 Security & Authentication

- **JWT-Based Authentication**
  - Access + refresh token mechanism
  - Automatic token rotation
  - Secure token storage

- **Google OAuth Integration**
  - "Continue with Google" one-click login
  - Automatic account creation
  - Email verification via Google

- **Rate Limiting**
  - 10 req/min for auth endpoints
  - 20 req/min for face recognition endpoints
  - DDoS protection

- **Data Protection**
  - Face embeddings stored securely (never images)
  - HTTPS enforcement in production
  - CORS restrictions
  - Input validation and sanitization

### 🎨 UI/UX Excellence

- **Modern Design System**
  - Tailwind CSS with custom components
  - Gradient backgrounds and smooth animations
  - Professional card layouts
  - Consistent spacing and typography

- **Responsive Design**
  - Mobile-first approach
  - Works on phones, tablets, and desktops
  - Touch-friendly interfaces
  - Adaptive layouts

- **Accessibility**
  - WCAG 2.1 AA compliant
  - Keyboard navigation support
  - Screen reader friendly
  - High contrast modes

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | UI framework |
| TypeScript | 5.2 | Type safety |
| Vite | 5.1 | Build tool & dev server |
| Tailwind CSS | 3.4 | Styling |
| TanStack Query | 5.22 | Data fetching & caching |
| React Router | 6.30 | Client-side routing |
| Axios | 1.6 | HTTP client |
| Recharts | 2.12 | Data visualization |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Programming language |
| Django | 5.2 | Web framework |
| Django REST Framework | 3.14 | API framework |
| MongoDB Atlas | Latest | Cloud database |
| django-mongodb-backend | 5.2.4 | MongoDB integration |
| Simple JWT | 5.3 | JWT authentication |
| InsightFace | 0.7.3+ | Face recognition |
| ONNX Runtime | 1.20+ | ML inference |
| OpenCV | 4.9+ | Image processing |

### AI/ML Models

| Model | Purpose | Size | Accuracy |
|-------|---------|------|----------|
| SCRFD (det_10g) | Face detection | ~17MB | 95%+ |
| ArcFace ResNet-50 (w600k_r50) | Face recognition | ~170MB | 99.3% |

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  React SPA (Port 3000) - TypeScript + Tailwind CSS         │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (JSON)
                         │ JWT Authentication
┌────────────────────────▼────────────────────────────────────┐
│                   Application Layer                          │
│  Django REST Framework (Port 8000)                          │
│  ├── Auth Module (JWT, OAuth)                               │
│  ├── Employee Management                                     │
│  ├── Attendance Service                                      │
│  ├── Face Recognition Module                                │
│  └── Dashboard & Analytics                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼─────┐  ┌──────▼──────┐
│   MongoDB    │  │ InsightFace │  │   Storage   │
│    Atlas     │  │   buffalo_l │  │   (Media)   │
│   Database   │  │  ONNX Model │  │   Avatars   │
└──────────────┘  └─────────────┘  └─────────────┘
```

### Database Schema

```
Users (Auth)
├── id (ObjectId)
├── email (unique)
├── password (hashed)
├── role (ADMIN/EMPLOYEE)
└── is_active

EmployeeProfiles
├── user_id (ref: Users)
├── first_name
├── last_name
├── employee_id
├── department
├── position
├── phone
└── avatar

FaceEmbeddings
├── user_id (ref: Users)
├── embedding_vector (512-d float array)
├── quality_score
├── detection_confidence
├── is_primary
└── registration_source

AttendanceRecords
├── user_id (ref: Users)
├── date
├── status (PRESENT/LATE/ABSENT/etc.)
├── check_in_time
├── check_out_time
├── work_hours
├── check_in_method (FACE/MANUAL)
└── admin_override
```

---

## 📸 Screenshots

### Login & Registration
![Login Page](docs/screenshots/login.png)
*Modern login page with Google OAuth integration*

### Dashboard
![Admin Dashboard](docs/screenshots/admin-dashboard.png)
*Admin dashboard with real-time attendance statistics*

![Employee Dashboard](docs/screenshots/employee-dashboard.png)
*Employee dashboard with personal attendance history*

### Face Recognition
![Face Enrollment](docs/screenshots/face-enrollment.png)
*Guided face enrollment with quality validation*

![Check-In](docs/screenshots/check-in.png)
*Real-time face recognition for attendance marking*

### Management
![Employee Management](docs/screenshots/employee-management.png)
*Complete employee CRUD with search and filters*

![Reports](docs/screenshots/reports.png)
*Advanced reporting with CSV export*

---

## 🚀 Installation

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- MongoDB Atlas account (free tier available)
- Internet connection (for InsightFace model download on first run)

### Quick Start

#### 1. Clone Repository

```bash
git clone https://github.com/Ebo1996/face-attendance-system.git
cd face-attendance-system
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your MongoDB URI and SECRET_KEY

# Run migrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

Backend will be available at `http://localhost:8000`

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env if needed (VITE_API_BASE_URL defaults to http://localhost:8000/api)

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

#### 4. Download ML Models (Optional but Recommended)

```bash
cd backend

# Pre-download InsightFace models (~300MB)
python - <<'EOF'
import insightface
app = insightface.app.FaceAnalysis(name='buffalo_l')
app.prepare(ctx_id=-1)
print("Models downloaded successfully!")
EOF
```

---

## ⚙️ Configuration

### Environment Variables

#### Backend (`backend/.env`)

```env
# Django Core
SECRET_KEY=your-50-character-random-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/
MONGODB_DATABASE=face_attendance

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# Face Recognition Thresholds
FACE_VERIFICATION_THRESHOLD=0.60
FACE_IDENTIFICATION_THRESHOLD=0.55
```

#### Frontend (`frontend/.env`)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api

# Google OAuth (Optional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (M0 Free tier works)
3. Create database user
4. Whitelist IP address (0.0.0.0/0 for testing)
5. Get connection string and add to `MONGODB_URI`

### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth client ID
3. Add authorized origins: `http://localhost:3000`
4. Copy Client ID to `VITE_GOOGLE_CLIENT_ID`

Full setup guide: [GOOGLE_OAUTH_QUICK_START.md](GOOGLE_OAUTH_QUICK_START.md)

---

## 📖 Usage

### For Employees

1. **Register Account**
   - Go to `/register`
   - Enter email and password OR use "Continue with Google"
   - Account created with EMPLOYEE role

2. **Enroll Face**
   - Navigate to "Face Enrollment"
   - Allow camera access
   - Capture face (follow on-screen guidance)
   - System stores 512-dimensional embedding (not images)

3. **Mark Attendance**
   - Navigate to "Attendance"
   - Click "Check In" or "Check Out"
   - Face recognition runs automatically
   - Status updated in real-time

4. **View Dashboard**
   - See today's status
   - View attendance calendar
   - Check work hours and statistics
   - Export personal reports

### For Admins

1. **Manage Employees**
   - Add/edit/deactivate employees
   - Assign roles
   - Update departments and positions

2. **Monitor Attendance**
   - View company-wide statistics
   - See who's present/absent today
   - Check 14-day attendance trends
   - Monthly breakdown

3. **Manual Overrides**
   - Mark attendance manually when needed
   - Add notes and adjustments
   - Handle special cases

4. **Generate Reports**
   - Export attendance data as CSV
   - Filter by date range, status, employee
   - Analyze in Excel/Google Sheets

---

## 📚 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/logout/
GET  /api/auth/me/
POST /api/auth/refresh/
POST /api/auth/change-password/
POST /api/auth/google/
```

### Employee Endpoints

```http
GET    /api/employees/
POST   /api/employees/
GET    /api/employees/{id}/
PATCH  /api/employees/{id}/update/
DELETE /api/employees/{id}/delete/
PATCH  /api/employees/profile/update/
POST   /api/employees/profile/avatar/
GET    /api/employees/stats/
```

### Face Recognition Endpoints

```http
POST /api/face/register/
POST /api/face/recognize/
GET  /api/face/enrollment-stats/
GET  /api/face/my-embeddings/
DELETE /api/face/embeddings/{id}/
```

### Attendance Endpoints

```http
POST /api/attendance/check-in/
POST /api/attendance/check-out/
GET  /api/attendance/today/
GET  /api/attendance/my-history/
GET  /api/attendance/my-stats/monthly/
GET  /api/attendance/my-stats/weekly/
GET  /api/attendance/admin/list/
GET  /api/attendance/admin/stats/daily/
GET  /api/attendance/admin/stats/monthly/
GET  /api/attendance/export/my/
GET  /api/attendance/export/admin/
```

### Dashboard Endpoints

```http
GET /api/dashboard/admin/
GET /api/dashboard/employee/
```

Full API documentation: [backend/README.md](backend/README.md)

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
python manage.py test apps
```

**Coverage:**
- 58 tests across all apps
- Unit tests for models, serializers, and views
- Integration tests for API endpoints
- Face recognition service tests (with mocks)

### Frontend Tests

```bash
cd frontend
npm test
```

**Coverage:**
- 85 tests across utilities and services
- Component unit tests
- Service layer tests
- Integration tests

### Manual Testing

Use the included test scripts:

```bash
# Test authentication
python backend/test_auth.py

# Test employee management
python backend/test_employees.py

# Test attendance
python backend/test_attendance.py

# Test face recognition
python backend/test_face_enrollment.py
python backend/test_face_matching.py
```

---

## 🌐 Deployment

### Production Checklist

#### Backend

- [ ] Set `DEBUG=False`
- [ ] Generate strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set up production database
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Run `python manage.py collectstatic`
- [ ] Run `python manage.py check --deploy`
- [ ] Set up Gunicorn or uWSGI
- [ ] Configure nginx reverse proxy
- [ ] Set up SSL certificate (Let's Encrypt)

#### Frontend

- [ ] Set production `VITE_API_BASE_URL`
- [ ] Add Google OAuth production origins
- [ ] Run `npm run build`
- [ ] Deploy `dist/` folder
- [ ] Configure CDN (optional)
- [ ] Enable gzip compression

### Deployment Options

#### Option 1: Traditional VPS (DigitalOcean, AWS EC2, etc.)

- Deploy backend with Gunicorn + Nginx
- Serve frontend as static files
- Use MongoDB Atlas for database
- Detailed guide: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

#### Option 2: Docker (Coming Soon)

```bash
docker-compose up -d
```

#### Option 3: Cloud Platforms

- **Backend**: Heroku, AWS Elastic Beanstalk, Google Cloud Run
- **Frontend**: Netlify, Vercel, AWS S3 + CloudFront
- **Database**: MongoDB Atlas (recommended)

Full deployment guide: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- **Python**: Follow PEP 8
- **TypeScript**: Follow Airbnb style guide
- **Git Commits**: Use conventional commits format

### Areas for Contribution

- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- 🧪 Additional tests
- 🌐 Translations
- ⚡ Performance optimizations

---

## 📄 License

MIT License

Copyright (c) 2024 [Ebisa Berhanu](https://github.com/Ebo1996)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 👨‍💻 Author

**Ebisa Berhanu**

- GitHub: [@Ebo1996](https://github.com/Ebo1996)
- LinkedIn: [Ebisa Berhanu](https://linkedin.com/in/ebisa-berhanu)
- Email: ebisaberhanu1996@gmail.com

---

## 🙏 Acknowledgments

### Technologies

- [InsightFace](https://github.com/deepinsight/insightface) - Face recognition models
- [Django](https://www.djangoproject.com/) - Web framework
- [React](https://react.dev/) - UI library
- [MongoDB](https://www.mongodb.com/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

### Inspiration

This project was built to solve real-world attendance tracking challenges in modern workplaces, combining security, efficiency, and user experience.

### Special Thanks

- InsightFace team for open-source face recognition models
- Django and React communities for excellent documentation
- MongoDB Atlas for providing free tier for development

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/Ebo1996/face-attendance-system?style=social)
![GitHub forks](https://img.shields.io/github/forks/Ebo1996/face-attendance-system?style=social)
![GitHub issues](https://img.shields.io/github/issues/Ebo1996/face-attendance-system)
![GitHub pull requests](https://img.shields.io/github/issues-pr/Ebo1996/face-attendance-system)

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Documentation](#documentation)
2. Search [existing issues](https://github.com/Ebo1996/face-attendance-system/issues)
3. Create a [new issue](https://github.com/Ebo1996/face-attendance-system/issues/new)

For urgent matters, contact: ebisaberhanu1996@gmail.com

---

## 🗺️ Roadmap

### Version 2.0 (Planned)

- [ ] Mobile applications (iOS & Android)
- [ ] Multi-language support
- [ ] Leave management integration
- [ ] Shift scheduling
- [ ] Geofencing for remote attendance
- [ ] Advanced analytics with ML insights
- [ ] Slack/Teams notifications
- [ ] Biometric device integration
- [ ] Payroll integration APIs
- [ ] Docker containerization

### Version 1.1 (In Progress)

- [x] Google OAuth integration
- [x] Profile page redesign
- [x] Reports page enhancement
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] Audit logs

---

<div align="center">

**⭐ If you find this project useful, please consider giving it a star! ⭐**

Made with ❤️ by [Ebisa Berhanu](https://github.com/Ebo1996)

</div>
