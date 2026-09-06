export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login/',
  REGISTER: '/auth/register/',
  REFRESH: '/auth/refresh/',
  ME: '/auth/me/',
  
  // Employees
  EMPLOYEES: '/employees/',
  EMPLOYEE_DETAIL: (id: string) => `/employees/${id}/`,
  
  // Face
  FACE_REGISTER: '/face/register/',
  FACE_RECOGNIZE: '/face/recognize/',
  
  // Attendance
  ATTENDANCE: '/attendance/',
  ATTENDANCE_DETAIL: (id: string) => `/attendance/${id}/`,
  ATTENDANCE_CHECK_IN: '/attendance/check-in/',
  ATTENDANCE_CHECK_OUT: '/attendance/check-out/',
  
  // Dashboard
  DASHBOARD_ADMIN: '/dashboard/admin/',
  DASHBOARD_EMPLOYEE: '/dashboard/employee/',
} as const
