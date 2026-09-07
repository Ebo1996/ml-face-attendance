/**
 * useAttendance
 *
 * TanStack Query–based hook for attendance data.
 * Provides today's status, history, monthly stats, and weekly stats
 * with automatic caching, background refetch, and loading / error states.
 *
 * Usage
 * -----
 *   const { todayStatus, summary, isLoading } = useAttendance();
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../services/attendance';

// ── Query keys ────────────────────────────────────────────────────────

export const ATTENDANCE_KEYS = {
  today:   ['attendance', 'today']   as const,
  summary: ['attendance', 'summary'] as const,
  weekly:  ['attendance', 'weekly']  as const,
  monthly: (year: number, month: number) => ['attendance', 'monthly', year, month] as const,
  history: (params: Record<string, unknown>) => ['attendance', 'history', params] as const,
};

// ── Today's status ────────────────────────────────────────────────────

export function useTodayAttendance() {
  return useQuery({
    queryKey:  ATTENDANCE_KEYS.today,
    queryFn:   () => attendanceService.getTodayStatus(),
    staleTime: 60_000,      // 1 min
    refetchInterval: 120_000, // background refresh every 2 min
  });
}

// ── Personal summary (dashboard cards) ───────────────────────────────

export function useAttendanceSummary() {
  return useQuery({
    queryKey:  ATTENDANCE_KEYS.summary,
    queryFn:   () => attendanceService.getMySummary(),
    staleTime: 5 * 60_000,  // 5 min
  });
}

// ── Weekly stats (chart data) ─────────────────────────────────────────

export function useWeeklyStats(refDate?: string) {
  return useQuery({
    queryKey:  [...ATTENDANCE_KEYS.weekly, refDate ?? 'current'],
    queryFn:   () => attendanceService.getMyWeeklyStats(refDate),
    staleTime: 5 * 60_000,
  });
}

// ── Monthly stats (calendar heatmap) ─────────────────────────────────

export function useMonthlyStats(year: number, month: number) {
  return useQuery({
    queryKey: ATTENDANCE_KEYS.monthly(year, month),
    queryFn:  () => attendanceService.getMyMonthlyStats(year, month),
    staleTime: 10 * 60_000,
  });
}

// ── History list ──────────────────────────────────────────────────────

export function useAttendanceHistory(params: {
  start_date?: string;
  end_date?:   string;
  limit?:      number;
} = {}) {
  return useQuery({
    queryKey: ATTENDANCE_KEYS.history(params),
    queryFn:  () => attendanceService.getMyHistory(params),
    staleTime: 2 * 60_000,
  });
}

// ── Combined dashboard hook ───────────────────────────────────────────

export function useAttendance() {
  const today   = useTodayAttendance();
  const summary = useAttendanceSummary();
  const weekly  = useWeeklyStats();

  return {
    todayStatus: today.data   ?? null,
    summary:     summary.data ?? null,
    weekly:      weekly.data  ?? null,
    isLoading:   today.isLoading || summary.isLoading || weekly.isLoading,
    isError:     today.isError   || summary.isError   || weekly.isError,
    refetch: () => {
      today.refetch();
      summary.refetch();
      weekly.refetch();
    },
  };
}

// ── Check-in mutation ─────────────────────────────────────────────────

export function useCheckIn() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (imageData: string) =>
      fetch(`${import.meta.env.VITE_API_BASE_URL}/attendance/check-in/`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ image_data: imageData }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ATTENDANCE_KEYS.today });
      qc.invalidateQueries({ queryKey: ATTENDANCE_KEYS.summary });
    },
  });
}
