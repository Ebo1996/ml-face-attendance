import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/employee/ProfilePage';
import { AttendancePage } from './pages/employee/AttendancePage';
import { EmployeeManagementPage } from './pages/admin/EmployeeManagementPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminRecognitionPage } from './pages/admin/AdminRecognitionPage';
import { AttendanceManagementPage } from './pages/admin/AttendanceManagementPage';
import { ProtectedRoute } from './components/routes/ProtectedRoute';
import { RoleRoute } from './components/routes/RoleRoute';
import { ToastContainer } from '@/components/common';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Employee */}
            <Route path="/dashboard"  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/profile"    element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/employees" element={
              <ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><EmployeeManagementPage /></RoleRoute></ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminDashboard /></RoleRoute></ProtectedRoute>
            } />
            <Route path="/admin/recognition" element={
              <ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminRecognitionPage /></RoleRoute></ProtectedRoute>
            } />
            <Route path="/admin/attendance" element={
              <ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AttendanceManagementPage /></RoleRoute></ProtectedRoute>
            } />

            {/* Default */}
            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <ToastContainer />
    </QueryClientProvider>
  );
}

export default App;
