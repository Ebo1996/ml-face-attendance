# ML Face Attendance System

<div align="center">

![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![Django](https://img.shields.io/badge/django-5.2-green.svg)
![React](https://img.shields.io/badge/react-18.2-blue.svg)
![MongoDB](https://img.shields.io/badge/mongodb-atlas-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**Enterprise-grade attendance management powered by AI face recognition**

🔗 [Live Demo](https://ml-face-attendance.vercel.app) • [API Docs](#api-documentation) • [Screenshots](#screenshots)

</div>

---

## Overview

Modern attendance system using InsightFace's ArcFace for real-time facial recognition. Eliminates buddy punching, provides touchless check-in/out, and delivers instant analytics dashboards.

**Key Benefits:**
- 99.3% recognition accuracy with sub-second processing
- Role-based dashboards (Admin & Employee)
- Automatic status assignment (Present, Late, Absent)
- Secure JWT + Google OAuth authentication
- Export reports with advanced filtering

---

## Features

### Core Capabilities
- **Face Recognition**: Real-time 1:N identification with 99.3% accuracy (InsightFace buffalo_l)
- **Smart Enrollment**: Multi-angle capture with quality validation and duplicate detection
- **Dual Dashboards**: Admin (company-wide stats, trends) & Employee (personal calendar, work hours)
- **Role-Based Access**: Admin (full control, manual overrides) & Employee (self-service)
- **Advanced Reports**: CSV export with filters (date, status, employee), bulk export (5,000+ records)

### Security
- JWT authentication with auto-refresh tokens
- Google OAuth integration
- Rate limiting (10 req/min auth, 20 req/min face recognition)
- Face embeddings stored (never raw images)
- HTTPS, CORS, input validation

### UI/UX
- Tailwind CSS with gradient designs
- Fully responsive (mobile-first)
- WCAG 2.1 AA accessible

---

## Tech Stack

**Frontend:** React 18.2 • TypeScript • Vite • Tailwind CSS • TanStack Query • React Router

**Backend:** Django 5.2 • DRF 3.14 • Python 3.10+ • MongoDB Atlas • JWT Auth

**AI/ML:** InsightFace (ArcFace ResNet-50) • ONNX Runtime • OpenCV

---

## Architecture

```
┌─────────────────┐
│  React Frontend │ (TypeScript + Tailwind CSS)
│   Port 3000     │
└────────┬────────┘
         │ REST API (JSON) + JWT Auth
┌────────▼────────┐
│  Django Backend │ (DRF + MongoDB)
│   Port 8000     │
└────────┬────────┘
         │
    ┌────┼────┐
┌───▼──┐ │ ┌──▼────┐
│MongoDB│ │ │InsightFace│
│ Atlas │ │ │ buffalo_l │
└───────┘ └─┴─────────┘
```

---

## Screenshots

<div align="center">

### Authentication
<img src="docs/screenshots/register.jpg" alt="Registration" width="700"/>

### Dashboards
<img src="docs/screenshots/admindashboard.jpg" alt="Admin Dashboard" width="700"/>
<img src="docs/screenshots/employeedashboard.jpg" alt="Employee Dashboard" width="700"/>

### Face Enrollment
<img src="docs/screenshots/face enrolment.jpg" alt="Face Enrollment" width="700"/>

### Attendance Marking
<img src="docs/screenshots/check in1.jpg" alt="Check In" width="700"/>

### Management & Reports
<img src="docs/screenshots/employeemanagement.jpg" alt="Employee Management" width="700"/>
<img src="docs/screenshots/report page for admin.jpg" alt="Reports" width="700"/>

</div>

---

## Quick Start

### Prerequisites
- Python 3.10+ • Node.js 18+ • MongoDB Atlas account

### Installation

```bash
# Clone repository
git clone https://github.com/Ebo1996/ml-face-attendance.git
cd ml-face-attendance

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Configure MongoDB URI
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver # http://localhost:8000

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                # http://localhost:3000
```

### Environment Configuration

**Backend (.env)**
```env
SECRET_KEY=your-secret-key-here
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id  # Optional
```

---

## API Endpoints

**Authentication:** `/api/auth/` - register, login, logout, refresh, google  
**Employees:** `/api/employees/` - CRUD, stats, profile, avatar  
**Face Recognition:** `/api/face/` - register, recognize, embeddings  
**Attendance:** `/api/attendance/` - check-in, check-out, history, stats  
**Reports:** `/api/attendance/export/` - CSV downloads  
**Dashboard:** `/api/dashboard/` - admin & employee stats

Full documentation: [API Reference](backend/README.md)

---

## Deployment

**Production Live:**
- **Frontend:** https://ml-face-attendance.vercel.app (Vercel)
- **Backend:** https://ml-face-attendance.onrender.com (Render)
- **Database:** MongoDB Atlas (Free Tier)

**Stack:**
- Frontend: Vercel (Vite build, Edge CDN)
- Backend: Render (Python 3.14, Gunicorn)
- Database: MongoDB Atlas M0 (512MB free)

**Configuration:** See [DEPLOYMENT_SUCCESS.md](DEPLOYMENT_SUCCESS.md) for complete setup details.

---

## License

MIT License - Copyright (c) 2024 [Ebisa Berhanu](https://github.com/Ebo1996)

---

## Author

**Ebisa Berhanu**  
GitHub: [@Ebo1996](https://github.com/Ebo1996) • Email: ebisaberhanu1996@gmail.com

---

## Acknowledgments

Built with [InsightFace](https://github.com/deepinsight/insightface), [Django](https://www.djangoproject.com/), [React](https://react.dev/), and [MongoDB Atlas](https://www.mongodb.com/).

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ for modern workplaces

</div>
