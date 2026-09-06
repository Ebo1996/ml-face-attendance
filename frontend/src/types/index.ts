export type UserRole = 'ADMIN' | 'EMPLOYEE'

export type AttendanceStatus = 
  | 'PRESENT' 
  | 'LATE' 
  | 'ABSENT' 
  | 'CHECKED_OUT' 
  | 'NOT_MARKED'

export interface User {
  id: string
  email: string
  role: UserRole
  isActive: boolean
}

export interface Employee {
  id: string
  employeeId: string
  name: string
  email: string
  phone?: string
  department?: string
  position?: string
  joiningDate?: string
  avatar?: string
  faceRegistered: boolean
  isActive: boolean
  userId: string
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  employee?: Employee
  date: string
  checkIn: string | null
  checkOut: string | null
  workingHours: string | null
  status: AttendanceStatus
  recognitionSource?: 'employee' | 'admin'
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  todayStatus: AttendanceStatus
  monthlyAttendance: number
  monthlyWorkingDays: number
  onTimeRate: number
  onTimeCheckins: number
  currentStreak: number
}

export interface AdminDashboardStats {
  totalEmployees: number
  presentToday: number
  lateToday: number
  absentToday: number
  attendanceRate: number
  faceRegistered: number
}

export interface ChartDataPoint {
  day: string
  Present: number
  Late: number
  Absent: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  phone?: string
  department?: string
  position?: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user: User
}

export interface FaceRegistrationResponse {
  success: boolean
  message: string
}

export interface FaceRecognitionResponse {
  recognized: boolean
  employeeId?: string
  confidence?: number
  message: string
}
