/**
 * src/types/index.ts
 * ==================
 * Canonical TypeScript types — single source of truth for the whole app.
 *
 * Rules
 * -----
 *   1. Every interface/type used by more than one file lives here.
 *   2. Service files import from here and re-export aliases for
 *      backwards-compatibility only — they must not re-declare shapes.
 *   3. Component-local types (props interfaces) stay in their own file.
 */

// ── Enumerations ──────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'EMPLOYEE';

export type AttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'ABSENT'
  | 'ON_LEAVE'
  | 'CHECKED_OUT'
  | 'NOT_MARKED';

export type RecognitionAction = 'CHECK_IN' | 'CHECK_OUT';

export type CheckInMethod =
  | 'FACE_RECOGNITION'
  | 'MANUAL_ADMIN'
  | 'SYSTEM';

export type RegistrationSource =
  | 'WEB_UPLOAD'
  | 'MOBILE_CAPTURE'
  | 'WEBCAM_CAPTURE'
  | 'ADMIN_UPLOAD';

export type ConfidenceLevel =
  | 'VERY_HIGH'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'VERY_LOW';

// ── Auth ──────────────────────────────────────────────────────────────

export interface AuthUser {
  id:          string;
  email:       string;
  role:        UserRole;
  is_active:   boolean;
  date_joined?: string;
  first_name?: string;
  last_name?:  string;
}

export interface LoginCredentials {
  email:    string;
  password: string;
}

export interface RegisterData {
  email:       string;
  password:    string;
  first_name?: string;
  last_name?:  string;
  role?:       UserRole;
}

export interface AuthResponse {
  access:  string;
  refresh: string;
  user:    AuthUser;
}

export interface AuthTokens {
  access:  string;
  refresh: string;
}

// ── Employee ──────────────────────────────────────────────────────────

export interface EmployeeProfile {
  first_name:   string;
  last_name:    string;
  phone:        string;
  department:   string;
  position:     string;
  employee_id:  string | null;
  avatar:       string | null;
  created_at:   string;
  updated_at:   string;
}

export interface Employee {
  id:          string;
  email:       string;
  role:        UserRole;
  is_active:   boolean;
  date_joined: string;
  full_name:   string;
  profile?:    EmployeeProfile;
}

export interface EmployeeListItem {
  id:          string;
  email:       string;
  role:        UserRole;
  is_active:   boolean;
  full_name:   string;
  department:  string;
  position:    string;
}

export interface EmployeeStats {
  total_employees:   number;
  active_employees:  number;
  inactive_employees: number;
  admin_count:       number;
  employee_count:    number;
  departments:       Array<{ department: string; count: number }>;
}

export interface EmployeeSearchParams {
  search?:     string;
  role?:       UserRole;
  department?: string;
  is_active?:  boolean;
}

export interface EmployeeUpdateData {
  email?:       string;
  role?:        UserRole;
  is_active?:   boolean;
  first_name?:  string;
  last_name?:   string;
  phone?:       string;
  department?:  string;
  position?:    string;
  employee_id?: string | null;
}

// ── Face / Biometric ──────────────────────────────────────────────────

export interface FaceEmbeddingInfo {
  id:                    string;
  user_email:            string;
  user_name:             string;
  quality_score:         number;
  detection_confidence:  number;
  estimated_age?:        number;
  gender?:               string;
  is_primary:            boolean;
  registration_source:   RegistrationSource;
  notes:                 string;
  is_active:             boolean;
  verified_by_admin:     boolean;
  embedding_dimension:   number;
  created_at:            string;
  updated_at:            string;
}

export interface EnrollmentStats {
  total_embeddings:   number;
  active_embeddings:  number;
  has_primary:        boolean;
  verified_count:     number;
  average_quality?:   number;
  best_quality?:      number;
  worst_quality?:     number;
}

export interface FaceRegisterRequest {
  image_data:          string;
  is_primary?:         boolean;
  registration_source?: RegistrationSource;
  notes?:              string;
}

export interface FaceRegisterResponse {
  success:       boolean;
  message?:      string;
  error?:        string;
  embedding_id?: string;
  quality_score?: number;
  is_primary?:   boolean;
}

// ── Recognition ───────────────────────────────────────────────────────

export interface RecognitionResult {
  recognized:        boolean;
  employee_id:       string | null;
  employee_name:     string | null;
  employee_email:    string | null;
  confidence:        number | null;
  confidence_level:  ConfidenceLevel | null;
  action:            RecognitionAction | null;
  attendance:        Partial<AttendanceRecord> | null;
  message:           string;
  error:             string | null;
  processing_time_ms?: number;
}

export interface MatchCandidate {
  user_id:          string;
  similarity:       number;
  confidence_level: ConfidenceLevel;
}

// ── Attendance ────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id:                      string;
  user_email:              string;
  user_name:               string;
  date:                    string;               // YYYY-MM-DD
  status:                  AttendanceStatus;
  check_in_time:           string | null;        // ISO datetime
  check_in_method:         CheckInMethod;
  check_in_similarity:     number | null;
  check_in_confidence:     string;
  check_out_time:          string | null;
  check_out_method:        CheckInMethod;
  check_out_similarity:    number | null;
  check_out_confidence:    string;
  work_hours:              number | null;
  admin_override:          boolean;
  notes:                   string;
  is_checked_in:           boolean;
  is_checked_out:          boolean;
  created_at:              string;
  updated_at:              string;
}

export interface TodayAttendanceStatus {
  has_record:    boolean;
  is_checked_in: boolean;
  is_checked_out: boolean;
  attendance:    AttendanceRecord | null;
}

export interface AttendanceListResponse {
  total:       number;
  page:        number;
  page_size:   number;
  total_pages: number;
  results:     AttendanceRecord[];
}

// ── Statistics ────────────────────────────────────────────────────────

export interface PersonalMonthlyStats {
  year:              number;
  month:             number;
  working_days:      number;
  PRESENT:           number;
  LATE:              number;
  HALF_DAY:          number;
  ABSENT:            number;
  ON_LEAVE:          number;
  attendance_rate:   number;
  avg_work_hours:    number;
  total_work_hours:  number;
  records: Array<{
    date:           string;
    status:         AttendanceStatus;
    check_in_time:  string | null;
    check_out_time: string | null;
    work_hours:     number | null;
  }>;
}

export interface PersonalWeeklyStats {
  week_start:        string;
  week_end:          string;
  days_recorded:     number;
  PRESENT:           number;
  LATE:              number;
  HALF_DAY:          number;
  ABSENT:            number;
  ON_LEAVE:          number;
  total_work_hours:  number;
  records: Array<{
    date:       string;
    status:     AttendanceStatus;
    work_hours: number | null;
  }>;
}

export interface PersonalSummary {
  today: string;
  this_month: {
    attendance_rate:   number;
    present:           number;
    late:              number;
    half_day:          number;
    total_work_hours:  number;
  };
  this_week: {
    days_recorded:     number;
    total_work_hours:  number;
  };
  on_time_streak: number;
}

export interface CompanyDailyStat {
  date:             string;
  total_employees:  number;
  checked_in:       number;
  absent:           number;
  present:          number;
  late:             number;
  half_day:         number;
  on_leave:         number;
  attendance_rate:  number;
  avg_work_hours:   number;
}

export interface CompanyMonthlyStat {
  year:             number;
  month:            number;
  total_employees:  number;
  total_records:    number;
  present:          number;
  late:             number;
  half_day:         number;
  on_leave:         number;
  attendance_rate:  number;
  avg_work_hours:   number;
  daily_breakdown:  Array<{
    date:      string;
    present:   number;
    late:      number;
    half_day:  number;
    absent:    number;
  }>;
}

// ── Dashboard ─────────────────────────────────────────────────────────

export interface AdminDashboardData {
  total_employees:  number;
  face_registered:  number;
  today:            CompanyDailyStat & { date: string };
  this_month:       Omit<CompanyMonthlyStat, 'daily_breakdown'>;
  weekly_trend:     CompanyDailyStat[];
}

export interface EmployeeDashboardData {
  today:           TodayAttendanceStatus;
  summary:         PersonalSummary;
  weekly:          PersonalWeeklyStats;
  face_registered: boolean;
  face_count:      number;
}

// ── Pagination ────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  total:       number;
  page:        number;
  page_size:   number;
  total_pages: number;
  results:     T[];
}

// ── UI helpers ────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn<T> {
  key:     keyof T | string;
  label:   string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?:  string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  detail?: string;
}

// ── Chart helpers ─────────────────────────────────────────────────────

export interface AttendanceChartPoint {
  day?:     string;
  date?:    string;
  present:  number;
  absent:   number;
  late:     number;
  hours?:   number;
}

// ── Auth request / response (used by services/auth.ts + AuthContext) ─

export interface LoginRequest {
  email:    string;
  password: string;
}

export interface RegisterRequest {
  email:            string;
  password:         string;
  password_confirm: string;
  role?:            UserRole;
}

export interface LoginResponse {
  user:    AuthUser;
  tokens:  AuthTokens;
  message: string;
}

export interface RegisterResponse {
  user:    AuthUser;
  tokens:  AuthTokens;
  message: string;
}

export interface ChangePasswordRequest {
  old_password:         string;
  new_password:         string;
  new_password_confirm: string;
}

export interface ChangePasswordResponse {
  message: string;
}

// ── Paginated attendance (used by admin list + reports) ───────────────

export interface PaginatedAttendance {
  total:       number;
  page:        number;
  page_size:   number;
  total_pages: number;
  records:     AttendanceRecord[];
}

// ── Face identification (admin 1:N, no attendance recorded) ───────────

export interface IdentifyCandidate {
  user_id:          string;
  similarity:       number;
  confidence_level: ConfidenceLevel;
}

export interface IdentifyFaceRequest {
  image_data: string;
  top_k?:     number;
}

export interface IdentifyFaceResponse {
  success:            boolean;
  identified:         boolean;
  top_match:          IdentifyCandidate | null;
  candidates:         IdentifyCandidate[];
  error?:             string;
  processing_time_ms: number;
}

// ── Convenience re-exports so consumers can use a single import ───────

/** @deprecated Import AuthUser directly — User is an alias for backwards compat. */
export type User = AuthUser;
