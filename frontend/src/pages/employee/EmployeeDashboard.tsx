/**
 * Employee Dashboard Page  (Phase 18 – live API data)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { WelcomeSection } from '../../components/dashboard/WelcomeSection';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { AttendanceChart } from '../../components/dashboard/AttendanceChart';
import { Spinner } from '../../components/common/Spinner';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { attendanceService, PersonalSummary, PersonalWeeklyStat, TodayStatus } from '../../services/attendance';

// ── Helpers ─────────────────────────────────────────────────────────

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  PRESENT: 'success', LATE: 'warning', HALF_DAY: 'info', ABSENT: 'danger', ON_LEAVE: 'default',
};
const STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present', LATE: 'Late', HALF_DAY: 'Half Day', ABSENT: 'Absent', ON_LEAVE: 'On Leave',
};

// ── QuickActions (live) ──────────────────────────────────────────────

const LiveQuickActions: React.FC<{ todayStatus: TodayStatus | null }> = ({ todayStatus }) => {
  const navigate = useNavigate();

  const actions = [
    {
      label: todayStatus?.is_checked_in ? 'Check Out' : 'Check In',
      description: todayStatus?.is_checked_in
        ? `Checked in at ${fmtTime(todayStatus.attendance?.check_in_time ?? null)}`
        : 'Use face recognition to mark attendance',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      primary: true,
      onClick: () => navigate('/attendance'),
    },
    {
      label: 'Attendance History',
      description: 'View your full attendance records',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      primary: false,
      onClick: () => navigate('/attendance'),
    },
    {
      label: 'Update Profile',
      description: 'Manage your personal information',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      primary: false,
      onClick: () => navigate('/profile'),
    },
  ];

  return (
    <Card>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        <p className="text-sm text-gray-500">Common tasks and shortcuts</p>
      </div>
      <div className="space-y-3">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left group
              ${action.primary
                ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
          >
            <div className={`flex-shrink-0 p-2 rounded-lg transition-colors
              ${action.primary
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
              }`}>
              {action.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{action.label}</p>
              <p className="text-xs text-gray-500">{action.description}</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </Card>
  );
};

// ── Weekly chart adapter ─────────────────────────────────────────────

function weeklyToChartData(weekly: PersonalWeeklyStat | null) {
  if (!weekly) return [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return weekly.records.map((r, i) => ({
    day: dayNames[i] ?? r.date,
    present: r.status === 'PRESENT' || r.status === 'LATE' ? 1 : 0,
    absent: r.status === 'ABSENT' ? 1 : 0,
    late: r.status === 'LATE' ? 1 : 0,
    hours: r.work_hours ?? 0,
  }));
}

// ── Main Dashboard ───────────────────────────────────────────────────

export const EmployeeDashboard: React.FC = () => {
  const [summary, setSummary]       = useState<PersonalSummary | null>(null);
  const [weekly, setWeekly]         = useState<PersonalWeeklyStat | null>(null);
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      attendanceService.getMySummary().catch(() => null),
      attendanceService.getMyWeeklyStats().catch(() => null),
      attendanceService.getTodayStatus().catch(() => null),
    ]).then(([sum, week, today]) => {
      setSummary(sum);
      setWeekly(week);
      setTodayStatus(today);
      setLoading(false);
    });
  }, []);

  // ── Today status values ───────────────────────────────────────────
  const todayStatusLabel = todayStatus?.attendance?.status
    ? STATUS_LABELS[todayStatus.attendance.status]
    : todayStatus?.is_checked_in ? 'Checked In' : 'Not Checked In';
  const todayVariant = todayStatus?.attendance?.status
    ? (STATUS_VARIANTS[todayStatus.attendance.status] ?? 'default')
    : todayStatus?.is_checked_in ? 'success' : 'default';
  const todaySubtitle = todayStatus?.attendance?.check_in_time
    ? `Checked in at ${fmtTime(todayStatus.attendance.check_in_time)}`
    : 'No check-in recorded today';

  // ── Month values ─────────────────────────────────────────────────
  const monthPresent = summary?.this_month.present ?? 0;
  const monthLate    = summary?.this_month.late ?? 0;
  const monthHalfDay = summary?.this_month.half_day ?? 0;
  const attendanceRate = summary?.this_month.attendance_rate ?? 0;

  // ── Chart data ────────────────────────────────────────────────────
  const chartData = weeklyToChartData(weekly);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">

        <WelcomeSection />

        {loading ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Today's Status"
                value={todayStatusLabel}
                subtitle={todaySubtitle}
                variant={todayVariant}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatsCard
                title="This Month"
                value={`${monthPresent + monthLate + monthHalfDay} days`}
                subtitle={`${attendanceRate}% attendance rate`}
                variant="primary"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
              <StatsCard
                title="Attendance Rate"
                value={`${attendanceRate}%`}
                subtitle="This month"
                variant={attendanceRate >= 90 ? 'success' : attendanceRate >= 75 ? 'default' : 'warning'}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />
              <StatsCard
                title="Late Arrivals"
                value={monthLate}
                subtitle="This month"
                variant={monthLate === 0 ? 'success' : 'warning'}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            {/* Chart + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {chartData.length > 0
                  ? <AttendanceChart data={chartData} />
                  : (
                    <Card>
                      <p className="text-center text-gray-500 py-8 text-sm">
                        No weekly data yet — check in to start tracking!
                      </p>
                    </Card>
                  )
                }
              </div>
              <div>
                <LiveQuickActions todayStatus={todayStatus} />
              </div>
            </div>

            {/* Today's detail card */}
            {todayStatus?.attendance && (
              <Card>
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Today's Detail</h2>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <Badge variant={STATUS_VARIANTS[todayStatus.attendance.status] ?? 'default'} className="mt-1">
                      {STATUS_LABELS[todayStatus.attendance.status] ?? todayStatus.attendance.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Check In</p>
                    <p className="font-semibold text-gray-800">{fmtTime(todayStatus.attendance.check_in_time)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Check Out</p>
                    <p className="font-semibold text-gray-800">{fmtTime(todayStatus.attendance.check_out_time)}</p>
                  </div>
                  {todayStatus.attendance.work_hours != null && (
                    <div>
                      <p className="text-xs text-gray-500">Hours Worked</p>
                      <p className="font-semibold text-gray-800">{todayStatus.attendance.work_hours}h</p>
                    </div>
                  )}
                  {summary?.on_time_streak != null && summary.on_time_streak > 0 && (
                    <div>
                      <p className="text-xs text-gray-500">On-Time Streak</p>
                      <p className="font-semibold text-purple-700">{summary.on_time_streak} days 🔥</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
