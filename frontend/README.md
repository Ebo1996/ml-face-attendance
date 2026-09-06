# Face Attendance System - Frontend

Modern React + TypeScript frontend for the Face Recognition Attendance System.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **TanStack Query** - Server state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Recharts** - Data visualization
- **Lucide React** - Icon library

## Project Structure

```
frontend/
├── src/
│   ├── assets/           # Static assets (images, fonts)
│   ├── components/       # Reusable components
│   │   ├── common/       # Shared UI components
│   │   ├── layout/       # Layout components
│   │   ├── forms/        # Form components
│   │   ├── camera/       # Camera components
│   │   ├── employees/    # Employee components
│   │   ├── attendance/   # Attendance components
│   │   └── dashboard/    # Dashboard components
│   ├── pages/            # Page components
│   │   ├── auth/         # Authentication pages
│   │   ├── employee/     # Employee pages
│   │   └── admin/        # Admin pages
│   ├── layouts/          # Layout wrappers
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services
│   ├── context/          # React context providers
│   ├── types/            # TypeScript type definitions
│   ├── mock/             # Mock data for development
│   ├── routes/           # Route configurations
│   ├── utils/            # Utility functions
│   ├── constants/        # Constants and configurations
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── public/               # Public static files
├── .env.example          # Environment variables example
└── package.json          # Dependencies and scripts
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update environment variables:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Build

Create a production build:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Features

### Employee Features
- Dashboard with attendance statistics
- Profile management
- Face registration
- Attendance marking via face recognition
- Attendance history

### Admin Features
- Admin dashboard with company statistics
- Employee management
- Face recognition interface
- Attendance management
- Reports and analytics

## API Integration

The frontend communicates with the Django backend API through Axios with TanStack Query for caching and state management.

Base URL: `http://localhost:8000/api`

## Design System

The application uses a custom design system based on Tailwind CSS with the following color palette:

- **Primary**: `#2368a2` (Blue)
- **Background**: `#f7f8fa` (Light gray)
- **Card**: `#ffffff` (White)
- **Muted**: `#eef2f6` (Light blue-gray)
- **Border**: `#e3e8ef` (Gray)

## Phase Completion

✅ Phase 1: Project setup complete
- Vite + React + TypeScript configured
- Tailwind CSS integrated
- All required dependencies installed
- Project structure created
- Type definitions added
- Environment variables configured
