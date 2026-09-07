/**
 * src/routes/index.ts
 * ===================
 * Central route configuration for the Face Attendance System.
 *
 * Re-exports the ProtectedRoute and RoleRoute guards so any file can import
 * from '@/routes' without knowing where the implementation lives.
 *
 * Also exports ROUTES — a typed constant map of every frontend path so that
 * navigations are never written as raw strings.
 *
 * Usage
 * -----
 *   import { ROUTES, ProtectedRoute, RoleRoute } from '@/routes';
 *
 *   // Navigate
 *   navigate(ROUTES.employee.dashboard);
 *
 *   // Guard
 *   <ProtectedRoute><SomePage /></ProtectedRoute>
 *   <RoleRoute allowedRoles={['ADMIN']}><AdminPage /></RoleRoute>
 */

// ── Route guards (implementations live in components/routes/) ────────

export { ProtectedRoute } from '../components/routes/ProtectedRoute';
export { RoleRoute }      from '../components/routes/RoleRoute';

// ── Route path map ────────────────────────────────────────────────────

export const ROUTES = {
  // Public
  login:    '/login',
  register: '/register',

  // Employee
  employee: {
    dashboard:        '/employee/dashboard',
    profile:          '/employee/profile',
    faceRegistration: '/employee/face-registration',
    recognition:      '/employee/recognition',
    attendance:       '/employee/attendance',
  },

  // Admin
  admin: {
    dashboard:  '/admin/dashboard',
    employees:  '/admin/employees',
    employee:   (id: string) => `/admin/employees/${id}`,
    recognition: '/admin/recognition',
    attendance:  '/admin/attendance',
  },

  // Shared
  reports: '/reports',
} as const;

/**
 * Derive the correct post-login redirect path for a given role.
 */
export function defaultRouteForRole(role: 'ADMIN' | 'EMPLOYEE'): string {
  return role === 'ADMIN' ? ROUTES.admin.dashboard : ROUTES.employee.dashboard;
}
