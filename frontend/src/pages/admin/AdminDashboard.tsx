/**
 * Admin Dashboard
 * Phase 15 — company-wide attendance stats, trend chart, and today's overview
 */

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
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

// ── Stat card ─────────────────────────────────────────────────────────

const BigStatCard: React.FC<{
  label: string; value: string | number; sub?: string;
  color: string; iconPath: string;
}> = ({ label, value, sub, color, iconPath }) => (
  <Card className={`${color} border-0`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-white/80">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
        {sub && <p className="text-xs text-white/70 mt-1">{sub}</p>}
      </div>
      <div className="p-2 bg-white/20 rounded-lg">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
      </div>
    </div>
  </Card>
);

// ── Trend bar chart ──────────────────────────────────────────────────

const TrendChart: React.FC<{ data: CompanyDailyStat[] }> = ({ data }) => {
  if (!data.length) return null;
  const maxCheckedIn = Math.max(...data.map(d => d.checked_in), 1);

  return (
    <div>
      <div className="flex items-end gap-1 h-32">
        {data.map((d) => {
          const heightPct = Math.round((d.checked_in / maxCheckedIn) * 100);
          const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString([], { weekday: 'short' });
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                {d.date}<br />
                Checked in: {d.checked_in} / {d.total_employees}<br />
                Rate: {d.attendance_rate}%
              </div>
              <div
                className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600 min-h-[4px]"
                style={{ height: `${Math.max(heightPct, 4)}%` }}
              />
              <span className="text-xs text-gray-500">{dayLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Monthly trend line ────────────────────────────────────────────────

const MonthlyTrendBars: React.FC<{ stats: CompanyMonthlyStat }> = ({ stats }) => {
  const data = stats.daily_breakdown.filter(d => d.present + d.late + d.half_day + d.absent > 0);
  if (!data.length) return <p className="text-gray-500 text-sm py-4 text-center">No data yet this month</p>;

  const max = Math.max(...data.map(d => d.present + d.late + d.half_day), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-[2px] h-28 min-w-0">
        {data.map((d) => {
          const total = d.present + d.late + d.half_day;
          const heightPct = Math.round((total / max) * 100);
          return (
            <div
              key={d.date}
              title={`${d.date}: ${total} checked in`}
              className="flex-1 bg-green-400 hover:bg-green-500 rounded-t min-h-[2px] transition-colors cursor-default"
              style={{ height: `${Math.max(heightPct, 2)}%`, minWidth: 4 }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{data[0]?.date?.slice(8)}</span>
        <span>{data[Math.floor(data.length / 2)]?.date?.slice(8)}</span>
        <span>{data[data.length - 1]?.date?.slice(8)}</span>
      </div>
    </div>
  );
};

// ── Today's table ────────────────────────────────────────────────────

interface TodayOverview {
  date: string;
  summary: { total_checked_in: number; present: number; late: number; half_day: number };
  records: AttendanceRecord[];
}

const TodayTable: React.FC<{ data: TodayOverview }> = ({ data }) => (
  <div>
    {/* Summary chips */}
    <div className="flex flex-wrap gap-2 mb-4">
      {[
        ['Checked In', data.summary.total_checked_in, 'bg-blue-100 text-blue-700'],
        ['Present', data.summary.present, 'bg-green-100 text-green-700'],
        ['Late', data.summary.late, 'bg-yellow-100 text-yellow-700'],
        ['Half Day', data.summary.half_day, 'bg-indigo-100 text-indigo-700'],
      ].map(([label, val, cls]) => (
        <span key={String(label)} className={`px-3 py-1 rounded-full text-sm font-medium ${cls}`}>
          {label}: {val}
        </span>
      ))}
    </div>

    {data.records.length === 0 ? (
      <p className="text-center text-gray-500 py-8">No check-ins recorded today yet</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600 text-left">
              <th className="py-2 px-3 font-semibold">Employee</th>
              <th className="py-2 px-3 font-semibold">Status</th>
              <th className="py-2 px-3 font-semibold">Check In</th>
              <th className="py-2 px-3 font-semibold">Check Out</th>
              <th className="py-2 px-3 font-semibold">Hours</th>
            </tr>
          </thead>
          <tbody>
            {data.records.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-3">
                  <div className="font-medium text-gray-800">{r.user_name}</div>
                  <div className="text-xs text-gray-500">{r.user_email}</div>
                </td>
                <td className="py-2 px-3">
                  <Badge variant={STATUS_VARIANTS[r.status] ?? 'default'}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </Badge>
                </td>
                <td className="py-2 px-3 text-gray-600">{fmtTime(r.check_in_time)}</td>
                <td className="py-2 px-3 text-gray-600">{fmtTime(r.check_out_time)}</td>
                <td className="py-2 px-3 text-gray-600">
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

// ── Main page ────────────────────────────────────────────────────────

export const AdminDashboard: React.FC = () => {
  const now = new Date();
  const [dailyStat, setDailyStat]       = useState<CompanyDailyStat | null>(null);
  const [monthlyStat, setMonthlyStat]   = useState<CompanyMonthlyStat | null>(null);
  const [recentDays, setRecentDays]     = useState<CompanyDailyStat[]>([]);
  const [todayOverview, setTodayOverview] = useState<TodayOverview | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

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
        setTodayOverview(today as TodayOverview);
      } catch {
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-red-500">{error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Company-wide attendance overview</p>
        </div>

        {/* Today stat cards */}
        {dailyStat && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <BigStatCard
              label="Total Employees"
              value={dailyStat.total_employees}
              color="bg-blue-600"
              iconPath="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <BigStatCard
              label="Attendance Rate"
              value={`${dailyStat.attendance_rate}%`}
              sub="Today"
              color="bg-green-600"
              iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <BigStatCard
              label="Late Today"
              value={dailyStat.late}
              color="bg-yellow-500"
              iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <BigStatCard
              label="Absent Today"
              value={dailyStat.absent}
              color="bg-red-500"
              iconPath="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 14-day trend */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              14-Day Attendance Trend
            </h2>
            {recentDays.length > 0
              ? <TrendChart data={recentDays} />
              : <p className="text-gray-500 text-sm py-4 text-center">No data available</p>
            }
          </Card>

          {/* Monthly trend */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">
              {MONTHS[(monthlyStat?.month ?? now.getMonth() + 1) - 1]} {monthlyStat?.year ?? now.getFullYear()} — Daily Trend
            </h2>
            {monthlyStat && (
              <div className="flex gap-4 text-xs text-gray-500 mb-3">
                <span>Avg rate: <strong className="text-gray-700">{monthlyStat.attendance_rate}%</strong></span>
                <span>Avg hrs: <strong className="text-gray-700">{monthlyStat.avg_work_hours}h</strong></span>
              </div>
            )}
            {monthlyStat ? <MonthlyTrendBars stats={monthlyStat} /> : <Spinner />}
          </Card>
        </div>

        {/* Monthly summary row */}
        {monthlyStat && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              ['Present', monthlyStat.present, 'text-green-600 bg-green-50'],
              ['Late', monthlyStat.late, 'text-yellow-600 bg-yellow-50'],
              ['Half Day', monthlyStat.half_day, 'text-blue-600 bg-blue-50'],
              ['On Leave', monthlyStat.on_leave, 'text-gray-600 bg-gray-50'],
              ['Total Records', monthlyStat.total_records, 'text-purple-600 bg-purple-50'],
            ].map(([label, val, cls]) => (
              <div key={String(label)} className={`rounded-xl p-4 text-center ${(cls as string).split(' ')[1]}`}>
                <p className={`text-2xl font-bold ${(cls as string).split(' ')[0]}`}>{val}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Today's check-ins */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Today's Attendance — {todayOverview?.date ?? new Date().toISOString().split('T')[0]}
          </h2>
          {todayOverview
            ? <TodayTable data={todayOverview} />
            : <Spinner />
          }
        </Card>
      </div>
    </DashboardLayout>
  );
};
