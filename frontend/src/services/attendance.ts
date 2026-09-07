/**
 * services/attendance.ts
 * ======================
 * Attendance API service — check-in/out, history, statistics.
 *
 * All types are imported from types/index.ts (single source of truth).
 * Named re-exports keep every existing consumer import working.
 */

import { apiClient } from './api';
import type {
  AttendanceRecord,
  TodayAttendanceStatus,
  PersonalMonthlyStats,
  PersonalWeeklyStats,
  PersonalSummary,
  CompanyDailyStat,
  CompanyMonthlyStat,
  PaginatedAttendance,
} from '../types';

// ── Backwards-compat re-exports ───────────────────────────────────────
export type { AttendanceRecord, PaginatedAttendance };

/** @deprecated Use TodayAttendanceStatus. Kept for existing imports. */
export type TodayStatus = TodayAttendanceStatus;
export type { TodayAttendanceStatus };

/** @deprecated Use PersonalMonthlyStats. Kept for existing imports. */
export type PersonalMonthlyStat = PersonalMonthlyStats;
export type { PersonalMonthlyStats };

/** @deprecated Use PersonalWeeklyStats. Kept for existing imports. */
export type PersonalWeeklyStat = PersonalWeeklyStats;
export type { PersonalWeeklyStats };

export type { PersonalSummary, CompanyDailyStat, CompanyMonthlyStat };

// ── Service ───────────────────────────────────────────────────────────

export const attendanceService = {
  // ── Employee endpoints ────────────────────────────────────────────

  /** Get the authenticated user's attendance status for today. */
  async getTodayStatus(): Promise<TodayAttendanceStatus> {
    return apiClient.get('/attendance/today/');
  },

  /** Get the authenticated user's attendance history. */
  async getMyHistory(params?: {
    start_date?: string;
    end_date?:   string;
    limit?:      number;
  }): Promise<AttendanceRecord[]> {
    const q = new URLSearchParams();
    if (params?.start_date) q.append('start_date', params.start_date);
    if (params?.end_date)   q.append('end_date',   params.end_date);
    if (params?.limit)      q.append('limit',      String(params.limit));
    const qs = q.toString();
    return apiClient.get(`/attendance/my-history/${qs ? `?${qs}` : ''}`);
  },

  /** Monthly attendance statistics for the authenticated user. */
  async getMyMonthlyStats(year?: number, month?: number): Promise<PersonalMonthlyStats> {
    const q = new URLSearchParams();
    if (year)  q.append('year',  String(year));
    if (month) q.append('month', String(month));
    return apiClient.get(`/attendance/my-stats/monthly/?${q.toString()}`);
  },

  /** Weekly attendance statistics for the authenticated user. */
  async getMyWeeklyStats(refDate?: string): Promise<PersonalWeeklyStats> {
    const q = refDate ? `?ref_date=${refDate}` : '';
    return apiClient.get(`/attendance/my-stats/weekly/${q}`);
  },

  /** Summary stats (streak, monthly totals) for the authenticated user. */
  async getMySummary(): Promise<PersonalSummary> {
    return apiClient.get('/attendance/my-stats/summary/');
  },

  // ── Admin endpoints ───────────────────────────────────────────────

  /** Company-wide attendance overview for today. */
  async getAdminTodayOverview(): Promise<CompanyDailyStat> {
    return apiClient.get('/attendance/admin/today/');
  },

  /** Company-wide daily stats for a specific date. */
  async getAdminDailyStats(date?: string): Promise<CompanyDailyStat> {
    const q = date ? `?date=${date}` : '';
    return apiClient.get(`/attendance/admin/stats/daily/${q}`);
  },

  /** Company-wide monthly stats. */
  async getAdminMonthlyStats(year?: number, month?: number): Promise<CompanyMonthlyStat> {
    const q = new URLSearchParams();
    if (year)  q.append('year',  String(year));
    if (month) q.append('month', String(month));
    return apiClient.get(`/attendance/admin/stats/monthly/?${q.toString()}`);
  },

  /** Company-wide daily stats for the last N days (for the trend chart). */
  async getAdminRecentDays(days?: number): Promise<CompanyDailyStat[]> {
    const q = days ? `?days=${days}` : '';
    return apiClient.get(`/attendance/admin/stats/recent/${q}`);
  },

  /** Paginated admin attendance list with filters. */
  async getAdminList(params?: {
    start_date?: string;
    end_date?:   string;
    status?:     string;
    user_id?:    string;
    page?:       number;
    page_size?:  number;
  }): Promise<PaginatedAttendance> {
    const q = new URLSearchParams();
    if (params?.start_date) q.append('start_date', params.start_date);
    if (params?.end_date)   q.append('end_date',   params.end_date);
    if (params?.status)     q.append('status',     params.status);
    if (params?.user_id)    q.append('user_id',    params.user_id);
    if (params?.page)       q.append('page',       String(params.page));
    if (params?.page_size)  q.append('page_size',  String(params.page_size));
    return apiClient.get(`/attendance/admin/list/?${q.toString()}`);
  },

  /** Attendance history for a specific employee. Admin only. */
  async getEmployeeHistory(
    userId: string,
    params?: { start_date?: string; end_date?: string; limit?: number },
  ): Promise<AttendanceRecord[]> {
    const q = new URLSearchParams();
    if (params?.start_date) q.append('start_date', params.start_date);
    if (params?.end_date)   q.append('end_date',   params.end_date);
    if (params?.limit)      q.append('limit',      String(params.limit));
    return apiClient.get(`/attendance/admin/employee/${userId}/?${q.toString()}`);
  },
};
