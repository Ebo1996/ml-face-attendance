/**
 * App.tsx — Route configuration
 *
 * Routes match the spec exactly:
 *   /login  /register
 *   /employee/dashboard  /employee/profile  /employee/face-registration
 *   /employee/recognition  /employee/attendance
 *   /admin/dashboard  /admin/employees  /admin/employees/:id
 *   /admin/recognition  /admin/attendance  /reports
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/routes/ProtectedRoute';
import { RoleRoute } from './components/routes/RoleRoute';
import { ToastContainer } from '@/components/common';
import { Spinner } from '@/components/common/Spinner';

// ── Lazy-load every page (code-splitting) ─────────────────────────────

// Auth
const LoginPage     = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage  = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));

// Employee
const EmployeeDashboard       = lazy(() => import('./pages/employee/EmployeeDashboard').then(m => ({ default: m.EmployeeDashboard })));
const ProfilePage             = lazy(() => import('./pages/employee/ProfilePage').then(m => ({ default: m.ProfilePage })));
const FaceRegistrationPage    = lazy(() => import('./pages/employee/FaceRegistrationPage').then(m => ({ default: m.FaceRegistrationPage })));
const RecognitionPage         = lazy(() => import('./pages/employee/RecognitionPage').then(m => ({ default: m.RecognitionPage })));
const AttendancePage          = lazy(() => import('./pages/employee/AttendancePage').then(m => ({ default: m.AttendancePage })));

// Admin
const AdminDashboard          = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const EmployeeManagementPage  = lazy(() => import('./pages/admin/EmployeeManagementPage').then(m => ({ default: m.EmployeeManagementPage })));
const EmployeeDetailPage      = lazy(() => import('./pages/admin/EmployeeDetailPage').then(m => ({ default: m.EmployeeDetailPage })));
const AdminRecognitionPage    = lazy(() => import('./pages/admin/AdminRecognitionPage').then(m => ({ default: m.AdminRecognitionPage })));
const AttendanceManagementPage = lazy(() => import('./pages/admin/AttendanceManagementPage').then(m => ({ default: m.AttendanceManagementPage })));
const ReportsPage             = lazy(() => import('./pages/admin/ReportsPage').then(m => ({ default: m.ReportsPage })));

// ── Full-page loader ──────────────────────────────────────────────────

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50" aria-label="Loading page">
    <Spinner size="lg" />
  </div>
);

// ── Query client (Phase 25: optimized settings) ──────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch behavior
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      
      // Retry configuration
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Cache configuration
      staleTime: 30 * 1000, // 30 seconds - data considered fresh
      gcTime: 5 * 60 * 1000, // 5 minutes - cache garbage collection (formerly cacheTime)
      
      // Performance
      networkMode: 'online', // Only run when online
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});

// ── App ───────────────────────────────────────────────────────────────

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>

              {/* ── Public ────────────────────────────────────────── */}
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* ── Employee (any authenticated user) ─────────────── */}
              <Route path="/employee/dashboard" element={
                <ProtectedRoute><EmployeeDashboard /></ProtectedRoute>
              } />
              <Route path="/employee/profile" element={
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              } />
              <Route path="/employee/face-registration" element={
                <ProtectedRoute><FaceRegistrationPage /></ProtectedRoute>
              } />
              <Route path="/employee/recognition" element={
                <ProtectedRoute><RecognitionPage /></ProtectedRoute>
              } />
              <Route path="/employee/attendance" element={
                <ProtectedRoute><AttendancePage /></ProtectedRoute>
              } />

              {/* ── Admin only ────────────────────────────────────── */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminDashboard /></RoleRoute></ProtectedRoute>
              } />
              <Route path="/admin/employees" element={
                <ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><EmployeeManagementPage /></RoleRoute></ProtectedRoute>
              } />
              <Route path="/admin/employees/:id" element={
                <ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><EmployeeDetailPage /></RoleRoute></ProtectedRoute>
              } />
              <Route path="/admin/recognition" element={
                <ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminRecognitionPage /></RoleRoute></ProtectedRoute>
              } />
              <Route path="/admin/attendance" element={
                <ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AttendanceManagementPage /></RoleRoute></ProtectedRoute>
              } />

              {/* ── Shared ────────────────────────────────────────── */}
              <Route path="/reports" element={
                <ProtectedRoute><ReportsPage /></ProtectedRoute>
              } />

              {/* ── Legacy / convenience redirects ────────────────── */}
              <Route path="/dashboard"  element={<Navigate to="/employee/dashboard" replace />} />
              <Route path="/profile"    element={<Navigate to="/employee/profile" replace />} />
              <Route path="/attendance" element={<Navigate to="/employee/attendance" replace />} />
              <Route path="/employees"  element={<Navigate to="/admin/employees" replace />} />

              {/* ── Default ───────────────────────────────────────── */}
              <Route path="/" element={<Navigate to="/employee/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />

            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
      <ToastContainer />
    </QueryClientProvider>
  );
}

export default App;
