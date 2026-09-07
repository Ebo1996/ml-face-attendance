/**
 * Admin Dashboard — professional redesign with Recharts
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import {
  attendanceService,
  CompanyDailyStat,
  CompanyMonthlyStat,
  AttendanceRecord,
} from '../../services/attendance';

// ── Helpers ──────────────────────────────────────────────────────────

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  PRESENT: 'success', LATE: 'warning', HALF_DAY: 'info', ABSENT: 'danger', ON_LEAVE: 'default',
};
const STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present', LATE: 'Late', HALF_DAY: 'Half Day', ABSENT: 'Absent', ON_LEAVE: 'On Leave',
};

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Stat Card ────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string; value: string | number; sub?: string; gradient: string; iconPath: string;
}> = ({ label, value, sub, gradient, iconPath }) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}>
    {/* Decoration */}
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
    <div className="absolute -bottom-2 -right-8 w-16 h-16 rounded-full bg-white/5" />
    <div className="relative">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
          </svg>
        </div>
        {sub && (
          <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
            {sub}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      <p className="text-white/70 text-xs font-medium mt-1">{label}</p>
    </div>
  </div>
);

// ── Custom Tooltip ────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-semibold text-slate-700">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Today Table ───────────────────────────────────────────────────────

interface TodayOverview {
  date: string;
  summary: { total_checked_in: number; present: number; late: number; half_day: number };
  records: AttendanceRecord[];
}

const TodayTable: React.FC<{ data: TodayOverview }> = ({ data }) => (
  <div>
    {/* Summary chips */}
    <div className="flex flex-wrap gap-2 mb-5">
      {[
        ['Checked In', data.summary.total_checked_in, 'bg-indigo-50 text-indigo-700 border-indigo-100'],
        ['Present',    data.summary.present,           'bg-emerald-50 text-emerald-700 border-emerald-100'],
        ['Late',       data.summary.late,              'bg-amber-50 text-amber-700 border-amber-100'],
        ['Half Day',   data.summary.half_day,          'bg-purple-50 text-purple-700 border-purple-100'],
      ].map(([label, val, cls]) => (
        <div key={String(label)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium ${cls}`}>
          <span className="font-bold">{val}</span>
          <span className="opacity-70">{label}</span>
        </div>
      ))}
    </div>

    {data.records.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-slate-500 text-sm font-medium">No check-ins recorded today yet</p>
      </div>
    ) : (
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['Employee', 'Status', 'Check In', 'Check Out', 'Hours'].map(h => (
                <th key={h} className="py-2.5 px-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.records.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {r.user_name?.slice(0, 2).toUpperCase() ?? r.user_email?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">{r.user_name}</p>
                      <p className="text-xs text-slate-400">{r.user_email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <Badge variant={STATUS_VARIANTS[r.status] ?? 'default'}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-slate-600 tabular-nums">{fmtTime(r.check_in_time)}</td>
                <td className="py-3 px-3 text-slate-600 tabular-nums">{fmtTime(r.check_out_time)}</td>
                <td className="py-3 px-3 text-slate-600 tabular-nums font-medium">
                  {r.work_hours != null ? `${r.work_hours}h` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// ── Main ─────────────────────────────────────────────────────────────

export const AdminDashboard: React.FC = () => {
  const now = new Date();
  const [dailyStat,     setDailyStat]     = useState<CompanyDailyStat | null>(null);
  const [monthlyStat,   setMonthlyStat]   = useState<CompanyMonthlyStat | null>(null);
  const [recentDays,    setRecentDays]    = useState<CompanyDailyStat[]>([]);
  const [todayOverview, setTodayOverview] = useState<TodayOverview | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [daily, monthly, recent, today] = await Promise.all([
          attendanceService.getAdminDailyStats(),
          attendanceService.getAdminMonthlyStats(now.getFullYear(), now.getMonth() + 1),
          attendanceService.getAdminRecentDays(14),
          attendanceService.getAdminTodayOverview(),
        ]);
        setDailyStat(daily);
        setMonthlyStat(monthly as CompanyMonthlyStat);
        setRecentDays(recent as CompanyDailyStat[]);
        setTodayOverview(today as unknown as TodayOverview);
      } catch {
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout>
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-sm">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    </DashboardLayout>
  );

  // Build chart data
  const trendData = recentDays.map(d => ({
    name: new Date(d.date + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
    'Checked In': d.checked_in,
    Rate: d.attendance_rate,
  }));

  const monthlyData = monthlyStat?.daily_breakdown
    .filter(d => d.present + d.late + d.half_day + d.absent > 0)
    .map(d => ({
      name: d.date.slice(8), // day number
      Present: d.present,
      Late: d.late,
      Absent: d.absent,
    })) ?? [];

  return (
    <DashboardLayout>
      <div className="p-5 md:p-6 space-y-5 max-w-7xl mx-auto">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">Live</span>
          </div>
        </div>

        {/* Stat cards */}
        {dailyStat && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Employees"
              value={dailyStat.total_employees}
              gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
              iconPath="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <StatCard
              label="Attendance Rate"
              value={`${dailyStat.attendance_rate}%`}
              sub="Today"
              gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <StatCard
              label="Late Arrivals"
              value={dailyStat.late}
              sub="Today"
              gradient="bg-gradient-to-br from-amber-400 to-orange-500"
              iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <StatCard
              label="Absent Today"
              value={dailyStat.absent}
              gradient="bg-gradient-to-br from-rose-500 to-red-600"
              iconPath="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 14-day trend */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card">
            <h2 className="text-sm font-bold text-slate-800 mb-0.5">14-Day Trend</h2>
            <p className="text-xs text-slate-400 mb-4">Daily check-ins over past 2 weeks</p>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="Checked In" stroke="#6366f1" strokeWidth={2} fill="url(#gradBlue)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-sm text-center py-10">No data available</p>
            )}
          </div>

          {/* Monthly breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card">
            <div className="flex items-center justify-between mb-0.5">
              <h2 className="text-sm font-bold text-slate-800">
                {MONTHS[(monthlyStat?.month ?? now.getMonth() + 1) - 1]} {monthlyStat?.year ?? now.getFullYear()}
              </h2>
              {monthlyStat && (
                <div className="flex gap-3 text-xs">
                  <span className="text-slate-400">Avg rate: <strong className="text-slate-700">{monthlyStat.attendance_rate}%</strong></span>
                  <span className="text-slate-400">Avg hrs: <strong className="text-slate-700">{monthlyStat.avg_work_hours}h</strong></span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-4">Daily attendance breakdown</p>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Present" fill="#10b981" radius={[3,3,0,0]} />
                  <Bar dataKey="Late"    fill="#f59e0b" radius={[3,3,0,0]} />
                  <Bar dataKey="Absent"  fill="#ef4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-sm text-center py-10">No data yet this month</p>
            )}
          </div>
        </div>

        {/* Monthly summary mini-cards */}
        {monthlyStat && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { label: 'Present',       val: monthlyStat.present,       color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Late',          val: monthlyStat.late,          color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100' },
              { label: 'Half Day',      val: monthlyStat.half_day,      color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-100' },
              { label: 'On Leave',      val: monthlyStat.on_leave,      color: 'text-slate-600',   bg: 'bg-slate-50 border-slate-100' },
              { label: 'Total Records', val: monthlyStat.total_records, color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-100' },
            ].map(({ label, val, color, bg }) => (
              <div key={label} className={`rounded-2xl border p-4 text-center ${bg}`}>
                <p className={`text-2xl font-bold ${color}`}>{val}</p>
                <p className="text-[11px] text-slate-400 mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Today's check-ins */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Today's Check-ins</h2>
              <p className="text-xs text-slate-400 mt-0.5">{todayOverview?.date ?? new Date().toISOString().split('T')[0]}</p>
            </div>
          </div>
          {todayOverview ? <TodayTable data={todayOverview} /> : <Spinner />}
        </div>

      </div>
    </DashboardLayout>
  );
};
