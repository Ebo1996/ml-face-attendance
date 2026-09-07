/**
 * constants/app.ts
 * ================
 * Application-wide UI and business constants.
 *
 * Keep values here rather than scattered as magic numbers/strings.
 */

// ── Attendance status display ─────────────────────────────────────────

import type { AttendanceStatus, ConfidenceLevel } from '../types';

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT:      'Present',
  LATE:         'Late',
  HALF_DAY:     'Half Day',
  ABSENT:       'Absent',
  ON_LEAVE:     'On Leave',
  CHECKED_OUT:  'Checked Out',
  NOT_MARKED:   'Not Marked',
};

export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  PRESENT:      'bg-green-100 text-green-700 border-green-200',
  LATE:         'bg-yellow-100 text-yellow-700 border-yellow-200',
  HALF_DAY:     'bg-blue-100 text-blue-700 border-blue-200',
  ABSENT:       'bg-red-100 text-red-700 border-red-200',
  ON_LEAVE:     'bg-purple-100 text-purple-700 border-purple-200',
  CHECKED_OUT:  'bg-gray-100 text-gray-600 border-gray-200',
  NOT_MARKED:   'bg-gray-50 text-gray-400 border-gray-100',
};

// ── Confidence level display ──────────────────────────────────────────

export const CONFIDENCE_LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  VERY_HIGH: 'Very High',
  HIGH:      'High',
  MEDIUM:    'Medium',
  LOW:       'Low',
  VERY_LOW:  'Very Low',
};

export const CONFIDENCE_LEVEL_COLORS: Record<ConfidenceLevel, string> = {
  VERY_HIGH: 'bg-green-100 text-green-700 border-green-200',
  HIGH:      'bg-blue-100 text-blue-700 border-blue-200',
  MEDIUM:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW:       'bg-orange-100 text-orange-700 border-orange-200',
  VERY_LOW:  'bg-red-100 text-red-700 border-red-200',
};

// ── Role display ──────────────────────────────────────────────────────

export const ROLE_LABELS = {
  ADMIN:    'Administrator',
  EMPLOYEE: 'Employee',
} as const;

// ── Pagination ────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// ── Face recognition ──────────────────────────────────────────────────

/** Minimum acceptable quality score to attempt face enrollment (0–1). */
export const MIN_FACE_QUALITY = 0.50;

/** Default recognition threshold (matches backend default). */
export const DEFAULT_RECOGNITION_THRESHOLD = 0.60;

/** Maximum image dimension (px) before compression for upload. */
export const UPLOAD_MAX_DIMENSION = 640;

/** JPEG quality for compressed uploads (0–1). */
export const UPLOAD_JPEG_QUALITY = 0.85;

/** Maximum face enrollments allowed per employee. */
export const MAX_FACE_ENROLLMENTS = 5;

// ── Date / time ───────────────────────────────────────────────────────

export const DATE_FORMAT = 'YYYY-MM-DD';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';

/** Office check-in grace period (minutes) before a record is marked LATE. */
export const LATE_THRESHOLD_MINUTES = 15;

/** Standard office start time (24-hour, used for late calculation). */
export const OFFICE_START_TIME = '09:00';

// ── Navigation ────────────────────────────────────────────────────────

export const SIDEBAR_WIDTH = 256; // px
export const HEADER_HEIGHT = 64;  // px

// ── Toast / notifications ─────────────────────────────────────────────

export const TOAST_DURATION_MS = 4000;
export const TOAST_DURATION_ERROR_MS = 6000;

// ── Query cache ───────────────────────────────────────────────────────

/** How long TanStack Query considers data "fresh" (ms). */
export const QUERY_STALE_TIME = 30_000;     // 30 s

/** How long TanStack Query keeps unused data in cache (ms). */
export const QUERY_GC_TIME = 5 * 60_000;   // 5 min

/** TanStack Query key prefixes — keep them here to avoid typos. */
export const QUERY_KEYS = {
  auth:           ['auth'],
  employees:      ['employees'],
  employee:       (id: string) => ['employees', id],
  attendance:     ['attendance'],
  todayStatus:    ['attendance', 'today'],
  myHistory:      ['attendance', 'my-history'],
  myMonthly:      ['attendance', 'my-monthly'],
  myWeekly:       ['attendance', 'my-weekly'],
  mySummary:      ['attendance', 'my-summary'],
  adminDashboard: ['dashboard', 'admin'],
  empDashboard:   ['dashboard', 'employee'],
  enrollment:     ['face', 'enrollment'],
  embeddings:     ['face', 'embeddings'],
} as const;
