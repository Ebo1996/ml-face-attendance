# Quick Start Guide - Face Attendance System

## 🚀 Running the Project

### Option 1: Manual (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
.\venv\Scripts\python.exe manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Option 2: Using Kiro (Current Setup)
Both servers are already running in the background!
- Backend: http://127.0.0.1:8000/
- Frontend: http://localhost:3000/

---

## 🔐 Admin Login

**URL**: http://localhost:3000/

**Credentials**:
- Email: `ebisaberhanu1996@gmail.com`
- Password: `ebisa1234`

---

## 📋 Quick Commands

### Backend Commands
```bash
cd backend

# List all users
.\venv\Scripts\python.exe list_users.py

# Test database connection
.\venv\Scripts\python.exe test_mongodb_dns_fix.py

# Create another admin (if needed)
.\venv\Scripts\python.exe quick_create_admin.py

# Run migrations (if needed)
.\venv\Scripts\python.exe manage.py migrate

# Create superuser (alternative method)
.\venv\Scripts\python.exe manage.py createsuperuser
```

### Frontend Commands
```bash
cd frontend

# Install dependencies (if needed)
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🎯 Testing the System

### 1. Login as Admin
1. Go to http://localhost:3000/
2. Click "Login"
3. Use admin credentials above
4. You should see the Admin Dashboard

### 2. Register New Employee
1. Click "Create Account"
2. Fill in employee details:
   - Full name
   - Email
   - Password
   - Phone (optional)
3. Upload a clear face photo
4. Submit

### 3. Test Face Recognition
- After registration, the face should be enrolled automatically
- Try marking attendance using face recognition
- Admin can view all attendance records

---

## ⚠️ Important Notes

### MongoDB Atlas Connection
- The system uses a DNS fix to connect to MongoDB Atlas
- This is applied automatically in the backend settings
- If connection fails, check `PROJECT_STATUS.md` for troubleshooting

### ML Models
- Face recognition models are loaded on first request
- First face detection may take 3-5 seconds
- Subsequent requests are much faster

### Ports
- Backend: 8000
- Frontend: 3000
- Make sure these ports are not in use by other applications

---

## 🐛 Common Issues

### "Port already in use"
```bash
# Find what's using the port
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### "Module not found"
```bash
# Backend
cd backend
.\venv\Scripts\pip.exe install -r requirements.txt

# Frontend
cd frontend
npm install
```

### "MongoDB connection failed"
```bash
# Test connection
cd backend
.\venv\Scripts\python.exe test_mongodb_dns_fix.py
```

---

## 📖 Documentation

- **Full Status**: `PROJECT_STATUS.md`
- **MongoDB Issues**: `MONGODB_CONNECTION_ISSUE.md`
- **Admin Creation**: `CREATE_ADMIN_README.md`

---

## 🎉 You're Ready!

The system is fully set up and ready to use. Enjoy your Face Attendance System! 🚀
