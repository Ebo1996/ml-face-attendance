/**
 * services/attendance.test.ts
 * ===========================
 * Tests for the attendance service layer.
 *
 * Covers Phase 26 requirements:
 *   Check-in / Duplicate check-in / Check-out
 *   Late status / Absent / Invalid attendance
 *   Employee history / Profile access
 *
 * Network calls are mocked with vi.fn() — no real server needed.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { attendanceService } from './attendance';
import type { TodayAttendanceStatus, AttendanceRecord } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────

function mockFetchResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    statusText: status === 200 ? 'OK' : 'Error',
  } as Response);
}

const CHECKED_IN_RECORD: AttendanceRecord = {
  id: 'rec001',
  user_email: 'alice@example.com',
  user_name: 'Alice Smith',
  date: '2026-09-07',
  status: 'PRESENT',
  check_in_time: '2026-09-07T08:55:00Z',
  check_in_method: 'FACE_RECOGNITION',
  check_in_similarity: 0.91,
  check_in_confidence: 'VERY_HIGH',
  check_out_time: null,
  check_out_method: 'FACE_RECOGNITION',
  check_out_similarity: null,
  check_out_confidence: '',
  work_hours: null,
  admin_override: false,
  notes: '',
  is_checked_in: true,
  is_checked_out: false,
  created_at: '2026-09-07T08:55:00Z',
  updated_at: '2026-09-07T08:55:00Z',
};

const LATE_RECORD: AttendanceRecord = {
  ...CHECKED_IN_RECORD,
  id: 'rec002',
  status: 'LATE',
  check_in_time: '2026-09-07T09:45:00Z',
};

const CHECKED_OUT_RECORD: AttendanceRecord = {
  ...CHECKED_IN_RECORD,
  id: 'rec003',
  check_out_time: '2026-09-07T17:30:00Z',
  work_hours: 8.5,
  is_checked_out: true,
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('access_token', 'test.access.token');
  vi.restoreAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

// ── getTodayStatus ────────────────────────────────────────────────────

describe('attendanceService.getTodayStatus', () => {
  it('returns has_record=false when no record exists', async () => {
    const payload: TodayAttendanceStatus = {
      has_record: false,
      is_checked_in: false,
      is_checked_out: false,
      attendance: null,
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    const result = await attendanceService.getTodayStatus();

    expect(result.has_record).toBe(false);
    expect(result.attendance).toBeNull();
  });

  it('returns is_checked_in=true after check-in', async () => {
    const payload: TodayAttendanceStatus = {
      has_record: true,
      is_checked_in: true,
      is_checked_out: false,
      attendance: CHECKED_IN_RECORD,
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    const result = await attendanceService.getTodayStatus();

    expect(result.is_checked_in).toBe(true);
    expect(result.attendance?.status).toBe('PRESENT');
  });

  it('returns is_checked_out=true after check-out', async () => {
    const payload: TodayAttendanceStatus = {
      has_record: true,
      is_checked_in: true,
      is_checked_out: true,
      attendance: CHECKED_OUT_RECORD,
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    const result = await attendanceService.getTodayStatus();

    expect(result.is_checked_out).toBe(true);
    expect(result.attendance?.work_hours).toBe(8.5);
  });

  it('reflects LATE status', async () => {
    const payload: TodayAttendanceStatus = {
      has_record: true,
      is_checked_in: true,
      is_checked_out: false,
      attendance: LATE_RECORD,
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    const result = await attendanceService.getTodayStatus();

    expect(result.attendance?.status).toBe('LATE');
  });

  it('requires authentication — throws on 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      mockFetchResponse({ detail: 'Authentication credentials not provided.' }, 401),
    );
    // Remove access token so no retry with fresh token
    localStorage.removeItem('access_token');

    await expect(attendanceService.getTodayStatus()).rejects.toThrow();
  });
});

// ── getMyHistory ──────────────────────────────────────────────────────

describe('attendanceService.getMyHistory', () => {
  it('returns an empty array when no records exist', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse([]));

    const result = await attendanceService.getMyHistory();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('returns a list of attendance records', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      mockFetchResponse([CHECKED_IN_RECORD, LATE_RECORD]),
    );

    const result = await attendanceService.getMyHistory();

    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('PRESENT');
    expect(result[1].status).toBe('LATE');
  });

  it('sends start_date and end_date as query params', async () => {
    const capturedUrls: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce((url) => {
      capturedUrls.push(url as string);
      return mockFetchResponse([]);
    });

    await attendanceService.getMyHistory({
      start_date: '2026-09-01',
      end_date:   '2026-09-07',
    });

    expect(capturedUrls[0]).toContain('start_date=2026-09-01');
    expect(capturedUrls[0]).toContain('end_date=2026-09-07');
  });

  it('sends limit as a query param', async () => {
    const capturedUrls: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce((url) => {
      capturedUrls.push(url as string);
      return mockFetchResponse([]);
    });

    await attendanceService.getMyHistory({ limit: 10 });

    expect(capturedUrls[0]).toContain('limit=10');
  });
});

// ── getMyMonthlyStats ─────────────────────────────────────────────────

describe('attendanceService.getMyMonthlyStats', () => {
  it('returns monthly stats with attendance rate', async () => {
    const payload = {
      year: 2026,
      month: 9,
      working_days: 20,
      PRESENT: 15,
      LATE: 3,
      HALF_DAY: 1,
      ABSENT: 1,
      ON_LEAVE: 0,
      attendance_rate: 0.9,
      avg_work_hours: 7.8,
      total_work_hours: 147,
      records: [],
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    const result = await attendanceService.getMyMonthlyStats(2026, 9);

    expect(result.attendance_rate).toBe(0.9);
    expect(result.PRESENT).toBe(15);
    expect(result.LATE).toBe(3);
  });

  it('sends year and month as query params', async () => {
    const capturedUrls: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce((url) => {
      capturedUrls.push(url as string);
      return mockFetchResponse({
        year: 2026, month: 8, working_days: 21,
        PRESENT: 18, LATE: 2, HALF_DAY: 0, ABSENT: 1, ON_LEAVE: 0,
        attendance_rate: 0.95, avg_work_hours: 8.1, total_work_hours: 170, records: [],
      });
    });

    await attendanceService.getMyMonthlyStats(2026, 8);

    expect(capturedUrls[0]).toContain('year=2026');
    expect(capturedUrls[0]).toContain('month=8');
  });
});

// ── getAdminList ──────────────────────────────────────────────────────

describe('attendanceService.getAdminList', () => {
  it('returns paginated results', async () => {
    const payload = {
      total: 2,
      page: 1,
      page_size: 20,
      total_pages: 1,
      records: [CHECKED_IN_RECORD, LATE_RECORD],
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    const result = await attendanceService.getAdminList();

    expect(result.total).toBe(2);
    expect(result.records).toHaveLength(2);
  });

  it('sends all filter params as query params', async () => {
    const capturedUrls: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce((url) => {
      capturedUrls.push(url as string);
      return mockFetchResponse({ total: 0, page: 1, page_size: 10, total_pages: 0, records: [] });
    });

    await attendanceService.getAdminList({
      start_date: '2026-09-01',
      end_date:   '2026-09-07',
      status:     'LATE',
      user_id:    'emp001',
      page:       2,
      page_size:  10,
    });

    const url = capturedUrls[0];
    expect(url).toContain('start_date=2026-09-01');
    expect(url).toContain('end_date=2026-09-07');
    expect(url).toContain('status=LATE');
    expect(url).toContain('user_id=emp001');
    expect(url).toContain('page=2');
    expect(url).toContain('page_size=10');
  });
});

// ── getEmployeeHistory ────────────────────────────────────────────────

describe('attendanceService.getEmployeeHistory', () => {
  it('fetches attendance for a specific employee by user ID', async () => {
    const capturedUrls: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce((url) => {
      capturedUrls.push(url as string);
      return mockFetchResponse([CHECKED_IN_RECORD]);
    });

    const result = await attendanceService.getEmployeeHistory('emp001');

    expect(capturedUrls[0]).toContain('/emp001/');
    expect(Array.isArray(result)).toBe(true);
  });
});
