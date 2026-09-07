/**
 * mock/attendance.ts
 * ==================
 * Realistic mock attendance records for the last 30 days.
 * Used in development, Storybook, and unit tests.
 */

import type {
  AttendanceRecord,
  AttendanceStatus,
  TodayAttendanceStatus,
  PersonalMonthlyStats,
  PersonalWeeklyStats,
  PersonalSummary,
  AdminDashboardData,
  EmployeeDashboardData,
  CompanyDailyStat,
} from '../types';

// ── Helpers ───────────────────────────────────────────────────────────

function isoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function isoTime(date: string, h: number, m: number): string {
  return `${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`;
}

function workHours(checkIn: string, checkOut: string | null): number | null {
  if (!checkOut) return null;
  return Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 36e5 * 100,
  ) / 100;
}

// ── Individual attendance records ─────────────────────────────────────

const BASE_STATUSES: AttendanceStatus[] = [
  'PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'PRESENT',
  'PRESENT', 'ABSENT',  'PRESENT', 'PRESENT', 'LATE',
  'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'HALF_DAY',
  'PRESENT', 'PRESENT', 'LATE',    'PRESENT', 'PRESENT',
];

export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = BASE_STATUSES.map(
  (status, i) => {
    const date     = isoDate(i + 1);
    const checkIn  = isoTime(date, status === 'LATE' ? 9 : 8, status === 'LATE' ? 15 : 52);
    const checkOut = status === 'ABSENT' ? null : isoTime(date, status === 'HALF_DAY' ? 13 : 17, 30);
    const hours    = workHours(checkIn, checkOut);

    return {
      id:                   `att-${String(i + 1).padStart(3, '0')}`,
      user_email:           'sarah.johnson@acme.com',
      user_name:            'Sarah Johnson',
      date,
      status,
      check_in_time:        status === 'ABSENT' ? null : checkIn,
      check_in_method:      'FACE_RECOGNITION',
      check_in_similarity:  status === 'ABSENT' ? null : 0.87 + Math.random() * 0.1,
      check_in_confidence:  'HIGH',
      check_out_time:       checkOut,
      check_out_method:     'FACE_RECOGNITION',
      check_out_similarity: checkOut ? 0.85 + Math.random() * 0.1 : null,
      check_out_confidence: checkOut ? 'HIGH' : '',
      work_hours:           hours,
      admin_override:       false,
      notes:                '',
      is_checked_in:        !!(status !== 'ABSENT' && !checkOut),
      is_checked_out:       !!checkOut,
      created_at:           checkIn ?? date + 'T00:00:00Z',
      updated_at:           checkOut ?? checkIn ?? date + 'T00:00:00Z',
    } satisfies AttendanceRecord;
  },
);

// ── Today status ──────────────────────────────────────────────────────

export const MOCK_TODAY_STATUS: TodayAttendanceStatus = {
  has_record:     true,
  is_checked_in:  true,
  is_checked_out: false,
  attendance: {
    ...MOCK_ATTENDANCE_RECORDS[0],
    date:           isoDate(0),
    status:         'PRESENT',
    check_in_time:  isoTime(isoDate(0), 8, 55),
    check_out_time: null,
    is_checked_in:  true,
    is_checked_out: false,
  },
};

// ── Personal stats ────────────────────────────────────────────────────

export const MOCK_MONTHLY_STATS: PersonalMonthlyStats = {
  year:             new Date().getFullYear(),
  month:            new Date().getMonth() + 1,
  working_days:     22,
  PRESENT:          17,
  LATE:             2,
  HALF_DAY:         1,
  ABSENT:           1,
  ON_LEAVE:         0,
  attendance_rate:  90.9,
  avg_work_hours:   7.85,
  total_work_hours: 157.0,
  records: MOCK_ATTENDANCE_RECORDS.slice(0, 20).map(r => ({
    date:           r.date,
    status:         r.status,
    check_in_time:  r.check_in_time,
    check_out_time: r.check_out_time,
    work_hours:     r.work_hours,
  })),
};

export const MOCK_WEEKLY_STATS: PersonalWeeklyStats = {
  week_start:       isoDate(6),
  week_end:         isoDate(0),
  days_recorded:    5,
  PRESENT:          4,
  LATE:             1,
  HALF_DAY:         0,
  ABSENT:           0,
  ON_LEAVE:         0,
  total_work_hours: 38.5,
  records: MOCK_ATTENDANCE_RECORDS.slice(0, 5).map(r => ({
    date:       r.date,
    status:     r.status,
    work_hours: r.work_hours,
  })),
};

export const MOCK_PERSONAL_SUMMARY: PersonalSummary = {
  today: isoDate(0),
  this_month: {
    attendance_rate:   90.9,
    present:           17,
    late:              2,
    half_day:          1,
    total_work_hours:  157.0,
  },
  this_week: {
    days_recorded:    5,
    total_work_hours: 38.5,
  },
  on_time_streak: 4,
};

// ── Dashboard data ────────────────────────────────────────────────────

const weeklyTrend: CompanyDailyStat[] = Array.from({ length: 7 }, (_, i) => ({
  date:             isoDate(6 - i),
  total_employees:  24,
  checked_in:       Math.floor(Math.random() * 5) + 18,
  absent:           Math.floor(Math.random() * 3) + 1,
  present:          Math.floor(Math.random() * 5) + 15,
  late:             Math.floor(Math.random() * 3),
  half_day:         Math.floor(Math.random() * 2),
  on_leave:         0,
  attendance_rate:  Math.round((18 + Math.random() * 5) / 24 * 100),
  avg_work_hours:   7 + Math.random(),
}));

export const MOCK_ADMIN_DASHBOARD: AdminDashboardData = {
  total_employees: 24,
  face_registered: 20,
  today: {
    date:             isoDate(0),
    total_employees:  24,
    checked_in:       18,
    absent:           3,
    present:          15,
    late:             3,
    half_day:         1,
    on_leave:         0,
    attendance_rate:  87.5,
    avg_work_hours:   6.2,
  },
  this_month: {
    year:             new Date().getFullYear(),
    month:            new Date().getMonth() + 1,
    total_employees:  24,
    total_records:    440,
    present:          380,
    late:             30,
    half_day:         10,
    on_leave:         5,
    attendance_rate:  91.4,
    avg_work_hours:   7.8,
  },
  weekly_trend: weeklyTrend,
};

export const MOCK_EMPLOYEE_DASHBOARD: EmployeeDashboardData = {
  today:           MOCK_TODAY_STATUS,
  summary:         MOCK_PERSONAL_SUMMARY,
  weekly:          MOCK_WEEKLY_STATS,
  face_registered: true,
  face_count:      2,
};
