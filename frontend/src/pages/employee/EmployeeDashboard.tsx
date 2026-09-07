/**
 * Employee Dashboard — professional redesign
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { WelcomeSection } from '../../components/dashboard/WelcomeSection';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { AttendanceChart } from '../../components/dashboard/AttendanceChart';
import { Spinner } from '../../components/common/Spinner';
import { Badge } from '../../components/common/Badge';
import {
  attendanceService,
  PersonalSummary,
  PersonalWeeklyStat,
  TodayStatus,
} from '../../services/attendance';

// ── Helpers ──────────────────────────────────────────────────────────

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'default' | 'danger'> = {
  PRESENT: 'success', LATE: 'warning', HALF_DAY: 'default', ABSENT: 'danger', ON_LEAVE: 'default',
};
const STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present', LATE: 'Late', HALF_DAY: 'Half Day', ABSENT: 'Absent', ON_LEAVE: 'On Leave',
};
const TODAY_STAT_VARIANT: Record<string, 'success' | 'warning' | 'default' | 'danger' | 'primary'> = {
  PRESENT: 'success', LATE: 'warning', HALF_DAY: 'default', ABSENT: 'danger', ON_LEAVE: 'default',
};

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

// ── Quick Actions ────────────────────────────────────────────────────

const QuickActions: React.FC<{ todayStatus: TodayStatus | null }> = ({ todayStatus }) => {
  const navigate = useNavigate();

  const actions = [
    {
      label: todayStatus?.is_checked_in ? 'Check Out' : 'Check In',
      desc: todayStatus?.is_checked_in
        ? `Checked in at ${fmtTime(todayStatus.attendance?.check_in_time ?? null)}`
        : 'Use face recognition',
      icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      primary: true,
      color: 'from-indigo-500 to-purple-600',
      onClick: () => navigate('/attendance'),
    },
    {
      label: 'Attendance History',
      desc: 'View all your records',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      primary: false,
      color: 'from-sky-500 to-blue-600',
      onClick: () => navigate('/employee/attendance'),
    },
    {
      label: 'Update Profile',
      desc: 'Manage your info',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      primary: false,
      color: 'from-emerald-500 to-teal-600',
      onClick: () => navigate('/employee/profile'),
    },
    {
      label: 'Register Face',
      desc: 'Update biometric data',
      icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7',
      primary: false,
      color: 'from-violet-500 to-purple-600',
      onClick: () => navigate('/employee/face-registration'),
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card">
      <h2 className="text-sm font-bold text-slate-800 mb-1">Quick Actions</h2>
      <p className="text-xs text-slate-400 mb-4">Common shortcuts</p>
      <div className="space-y-2.5">
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={a.onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group
              ${a.primary
                ? 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'
                : 'border-slate-100 hover:border-indigo-100 hover:bg-slate-50'
              }`}
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.icon} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">{a.label}</p>
              <p className="text-xs text-slate-400 truncate">{a.desc}</p>
            </div>
            <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Today Detail Card ────────────────────────────────────────────────

const TodayDetailCard: React.FC<{ todayStatus: TodayStatus; summary: PersonalSummary | null }> = ({ todayStatus, summary }) => {
  const att = todayStatus.attendance!;
  const items = [
    { label: 'Status', value: <Badge variant={STATUS_VARIANTS[att.status] ?? 'default'}>{STATUS_LABELS[att.status] ?? att.status}</Badge> },
    { label: 'Check In',  value: fmtTime(att.check_in_time) },
    { label: 'Check Out', value: fmtTime(att.check_out_time) },
    ...(att.work_hours != null ? [{ label: 'Hours Worked', value: `${att.work_hours}h` }] : []),
    ...(summary?.on_time_streak ? [{ label: 'Streak 🔥', value: `${summary.on_time_streak} days` }] : []),
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card">
      <h2 className="text-sm font-bold text-slate-800 mb-4">Today's Detail</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {items.map(({ label, value }) => (
          <div key={label} className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <div className="text-sm font-semibold text-slate-700">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────

export const EmployeeDashboard: React.FC = () => {
  const [summary, setSummary]         = useState<PersonalSummary | null>(null);
  const [weekly, setWeekly]           = useState<PersonalWeeklyStat | null>(null);
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [loading, setLoading]         = useState(true);

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

  const todayStatusLabel = todayStatus?.attendance?.status
    ? STATUS_LABELS[todayStatus.attendance.status]
    : todayStatus?.is_checked_in ? 'Checked In' : 'Not Checked In';
  const todayVariant = todayStatus?.attendance?.status
    ? (TODAY_STAT_VARIANT[todayStatus.attendance.status] ?? 'default')
    : todayStatus?.is_checked_in ? 'success' : 'default';
  const todaySubtitle = todayStatus?.attendance?.check_in_time
    ? `Checked in at ${fmtTime(todayStatus.attendance.check_in_time)}`
    : 'No check-in yet today';

  const monthPresent  = summary?.this_month.present ?? 0;
  const monthLate     = summary?.this_month.late ?? 0;
  const monthHalfDay  = summary?.this_month.half_day ?? 0;
  const attendanceRate = summary?.this_month.attendance_rate ?? 0;
  const chartData     = weeklyToChartData(weekly);

  return (
    <DashboardLayout>
      <div className="p-5 md:p-6 space-y-5 max-w-7xl mx-auto">

        {/* Welcome */}
        <WelcomeSection />

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Today's Status"
                value={todayStatusLabel}
                subtitle={todaySubtitle}
                variant={todayVariant}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <StatsCard
                title="Days Present"
                value={`${monthPresent + monthLate + monthHalfDay}`}
                subtitle="This month"
                variant="primary"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              />
              <StatsCard
                title="Attendance Rate"
                value={`${attendanceRate}%`}
                subtitle="This month"
                variant={attendanceRate >= 90 ? 'success' : attendanceRate >= 75 ? 'default' : 'warning'}
                trend={attendanceRate > 0 ? { value: Math.abs(attendanceRate - 90), isPositive: attendanceRate >= 90 } : undefined}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              />
              <StatsCard
                title="Late Arrivals"
                value={monthLate}
                subtitle="This month"
                variant={monthLate === 0 ? 'success' : 'warning'}
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
            </div>

            {/* Chart + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                {chartData.length > 0 ? (
                  <AttendanceChart data={chartData} />
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-card flex flex-col items-center justify-center gap-3 text-center h-full">
                    <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
                      <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-600">No data yet this week</p>
                    <p className="text-xs text-slate-400">Check in to start tracking your attendance</p>
                  </div>
                )}
              </div>
              <QuickActions todayStatus={todayStatus} />
            </div>

            {/* Today detail */}
            {todayStatus?.attendance && (
              <TodayDetailCard todayStatus={todayStatus} summary={summary} />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
