/**
 * Attendance API Service
 */

import { apiClient } from './api';

export interface AttendanceRecord {
  id: string;
  user_email: string;
  user_name: string;
  date: string;
  status: 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'ON_LEAVE';
  check_in_time: string | null;
  check_in_method: string;
  check_in_similarity: number | null;
  check_in_confidence: string;
  check_out_time: string | null;
  check_out_method: string;
  check_out_similarity: number | null;
  check_out_confidence: string;
  work_hours: number | null;
  admin_override: boolean;
  notes: string;
  is_checked_in: boolean;
  is_checked_out: boolean;
  created_at: string;
  updated_at: string;
}

export interface TodayStatus {
  has_record: boolean;
  is_checked_in: boolean;
  is_checked_out: boolean;
  attendance: AttendanceRecord | null;
}

export interface PersonalMonthlyStat {
  year: number;
  month: number;
  working_days: number;
  PRESENT: number;
  LATE: number;
  HALF_DAY: number;
  ABSENT: number;
  ON_LEAVE: number;
  attendance_rate: number;
  avg_work_hours: number;
  total_work_hours: number;
  records: Array<{
    date: string;
    status: string;
    check_in_time: string | null;
    check_out_time: string | null;
    work_hours: number | null;
  }>;
}

export interface PersonalWeeklyStat {
  week_start: string;
  week_end: string;
  days_recorded: number;
  PRESENT: number;
  LATE: number;
  HALF_DAY: number;
  ABSENT: number;
  ON_LEAVE: number;
  total_work_hours: number;
  records: Array<{ date: string; status: string; work_hours: number | null }>;
}

export interface PersonalSummary {
  today: string;
  this_month: {
    attendance_rate: number;
    present: number;
    late: number;
    half_day: number;
    total_work_hours: number;
  };
  this_week: {
    days_recorded: number;
    total_work_hours: number;
  };
  on_time_streak: number;
}

export interface CompanyDailyStat {
  date: string;
  total_employees: number;
  checked_in: number;
  absent: number;
  present: number;
  late: number;
  half_day: number;
  on_leave: number;
  attendance_rate: number;
  avg_work_hours: number;
}

export interface CompanyMonthlyStat {
  year: number;
  month: number;
  total_employees: number;
  total_records: number;
  present: number;
  late: number;
  half_day: number;
  on_leave: number;
  attendance_rate: number;
  avg_work_hours: number;
  daily_breakdown: Array<{
    date: string;
    present: number;
    late: number;
    half_day: number;
    absent: number;
  }>;
}

export interface PaginatedAttendance {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  records: AttendanceRecord[];
}

export const attendanceService = {
  // ── Employee ─────────────────────────────────────────────────────
  async getTodayStatus(): Promise<TodayStatus> {
    return apiClient.get('/attendance/today/');
  },

  async getMyHistory(params?: { start_date?: string; end_date?: string; limit?: number }): Promise<AttendanceRecord[]> {
    const q = new URLSearchParams();
    if (params?.start_date) q.append('start_date', params.start_date);
    if (params?.end_date)   q.append('end_date', params.end_date);
    if (params?.limit)      q.append('limit', String(params.limit));
    const qs = q.toString();
    return apiClient.get(`/attendance/my-history/${qs ? `?${qs}` : ''}`);
  },

  async getMyMonthlyStats(year?: number, month?: number): Promise<PersonalMonthlyStat> {
    const q = new URLSearchParams();
    if (year)  q.append('year', String(year));
    if (month) q.append('month', String(month));
    return apiClient.get(`/attendance/my-stats/monthly/?${q.toString()}`);
  },

  async getMyWeeklyStats(refDate?: string): Promise<PersonalWeeklyStat> {
    const q = refDate ? `?ref_date=${refDate}` : '';
    return apiClient.get(`/attendance/my-stats/weekly/${q}`);
  },

  async getMySummary(): Promise<PersonalSummary> {
    return apiClient.get('/attendance/my-stats/summary/');
  },

  // ── Admin ─────────────────────────────────────────────────────────
  async getAdminTodayOverview() {
    return apiClient.get('/attendance/admin/today/');
  },

  async getAdminDailyStats(date?: string): Promise<CompanyDailyStat> {
    const q = date ? `?date=${date}` : '';
    return apiClient.get(`/attendance/admin/stats/daily/${q}`);
  },

  async getAdminMonthlyStats(year?: number, month?: number): Promise<CompanyMonthlyStat> {
    const q = new URLSearchParams();
    if (year)  q.append('year', String(year));
    if (month) q.append('month', String(month));
    return apiClient.get(`/attendance/admin/stats/monthly/?${q.toString()}`);
  },

  async getAdminRecentDays(days?: number): Promise<CompanyDailyStat[]> {
    const q = days ? `?days=${days}` : '';
    return apiClient.get(`/attendance/admin/stats/recent/${q}`);
  },

  async getAdminList(params?: {
    start_date?: string; end_date?: string; status?: string;
    user_id?: string; page?: number; page_size?: number;
  }): Promise<PaginatedAttendance> {
    const q = new URLSearchParams();
    if (params?.start_date) q.append('start_date', params.start_date);
    if (params?.end_date)   q.append('end_date', params.end_date);
    if (params?.status)     q.append('status', params.status);
    if (params?.user_id)    q.append('user_id', params.user_id);
    if (params?.page)       q.append('page', String(params.page));
    if (params?.page_size)  q.append('page_size', String(params.page_size));
    return apiClient.get(`/attendance/admin/list/?${q.toString()}`);
  },

  async getEmployeeHistory(userId: string, params?: { start_date?: string; end_date?: string; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.start_date) q.append('start_date', params.start_date);
    if (params?.end_date)   q.append('end_date', params.end_date);
    if (params?.limit)      q.append('limit', String(params.limit));
    return apiClient.get(`/attendance/admin/employee/${userId}/?${q.toString()}`);
  },
};
