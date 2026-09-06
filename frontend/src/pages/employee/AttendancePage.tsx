/**
 * Employee Attendance History Page
 * Phase 14 — shows personal stats, monthly calendar heat-map, and history table
 */

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import {
  attendanceService,
  AttendanceRecord,
  PersonalMonthlyStat,
  PersonalSummary,
} from '../../services/attendance';

// ── helpers ─────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present',
  LATE: 'Late',
  HALF_DAY: 'Half Day',
  ABSENT: 'Absent',
  ON_LEAVE: 'On Leave',
};

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  PRESENT: 'success',
  LATE: 'warning',
  HALF_DAY: 'info',
  ABSENT: 'danger',
  ON_LEAVE: 'default',
};

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-green-500',
  LATE: 'bg-yellow-400',
  HALF_DAY: 'bg-blue-400',
  ABSENT: 'bg-red-400',
  ON_LEAVE: 'bg-gray-400',
  NONE: 'bg-gray-100',
};

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Sub-components ───────────────────────────────────────────────────

const SummaryCards: React.FC<{ summary: PersonalSummary }> = ({ summary }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <Card className="bg-green-50 border-green-200 text-center">
      <p className="text-2xl font-bold text-green-700">{summary.this_month.attendance_rate}%</p>
      <p className="text-sm text-gray-600 mt-1">Attendance Rate</p>
    </Card>
    <Card className="bg-blue-50 border-blue-200 text-center">
      <p className="text-2xl font-bold text-blue-700">{summary.this_month.total_work_hours}h</p>
      <p className="text-sm text-gray-600 mt-1">Hours This Month</p>
    </Card>
    <Card className="bg-yellow-50 border-yellow-200 text-center">
      <p className="text-2xl font-bold text-yellow-700">{summary.this_week.total_work_hours}h</p>
      <p className="text-sm text-gray-600 mt-1">Hours This Week</p>
    </Card>
    <Card className="bg-purple-50 border-purple-200 text-center">
      <p className="text-2xl font-bold text-purple-700">{summary.on_time_streak}</p>
      <p className="text-sm text-gray-600 mt-1">On-Time Streak</p>
    </Card>
  </div>
);

const MonthPicker: React.FC<{
  year: number; month: number;
  onChange: (y: number, m: number) => void;
}> = ({ year, month, onChange }) => {
  const prev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };
  const next = () => {
    const now = new Date();
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return;
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };
  return (
    <div className="flex items-center gap-3">
      <button onClick={prev} className="p-1 rounded hover:bg-gray-100 transition-colors" aria-label="Previous month">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="font-semibold text-gray-800 min-w-[140px] text-center">
        {MONTHS[month - 1]} {year}
      </span>
      <button onClick={next} className="p-1 rounded hover:bg-gray-100 transition-colors" aria-label="Next month">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

const CalendarHeatMap: React.FC<{ stats: PersonalMonthlyStat }> = ({ stats }) => {
  // Build date → status map
  const statusMap: Record<string, string> = {};
  stats.records.forEach(r => { statusMap[r.date] = r.status; });

  const firstDay = new Date(stats.year, stats.month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(stats.year, stats.month, 0).getDate();

  const cells: React.ReactNode[] = [];
  // empty leading cells
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`e${i}`} />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${stats.year}-${String(stats.month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const s = statusMap[dateStr] || 'NONE';
    const today = new Date().toISOString().split('T')[0];
    const isToday = dateStr === today;
    cells.push(
      <div
        key={d}
        title={`${dateStr}: ${STATUS_LABELS[s] || 'No record'}`}
        className={`
          aspect-square rounded flex items-center justify-center text-xs font-medium
          ${STATUS_COLORS[s]} transition-transform hover:scale-110 cursor-default
          ${isToday ? 'ring-2 ring-blue-500' : ''}
          ${s === 'NONE' ? 'text-gray-400' : 'text-white'}
        `}
      >
        {d}
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-600">
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1">
            <span className={`w-3 h-3 rounded ${STATUS_COLORS[k]}`} />
            {v}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />No record
        </span>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 pb-1">{d}</div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">{cells}</div>

      {/* Monthly totals */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-5 pt-4 border-t border-gray-100">
        {([
          ['Present', stats.PRESENT, 'text-green-600'],
          ['Late', stats.LATE, 'text-yellow-600'],
          ['Half Day', stats.HALF_DAY, 'text-blue-600'],
          ['Absent', stats.ABSENT, 'text-red-600'],
          ['On Leave', stats.ON_LEAVE, 'text-gray-600'],
        ] as [string, number, string][]).map(([label, val, cls]) => (
          <div key={label} className="text-center">
            <p className={`text-xl font-bold ${cls}`}>{val}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const HistoryTable: React.FC<{ records: AttendanceRecord[] }> = ({ records }) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>No records found for this period</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-600">
            <th className="py-3 px-4 font-semibold">Date</th>
            <th className="py-3 px-4 font-semibold">Status</th>
            <th className="py-3 px-4 font-semibold">Check In</th>
            <th className="py-3 px-4 font-semibold">Check Out</th>
            <th className="py-3 px-4 font-semibold">Hours</th>
            <th className="py-3 px-4 font-semibold">Method</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4 font-medium text-gray-800">{fmtDate(r.date)}</td>
              <td className="py-3 px-4">
                <Badge variant={STATUS_VARIANTS[r.status] ?? 'default'}>
                  {STATUS_LABELS[r.status] ?? r.status}
                </Badge>
              </td>
              <td className="py-3 px-4 text-gray-600">{fmtTime(r.check_in_time)}</td>
              <td className="py-3 px-4 text-gray-600">{fmtTime(r.check_out_time)}</td>
              <td className="py-3 px-4 text-gray-600">
                {r.work_hours != null ? `${r.work_hours}h` : '—'}
              </td>
              <td className="py-3 px-4 text-gray-500 capitalize text-xs">
                {r.check_in_method?.replace('_', ' ').toLowerCase() ?? '—'}
                {r.admin_override && (
                  <span className="ml-1 text-blue-500">(admin)</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────

export const AttendancePage: React.FC = () => {
  const now = new Date();
  const [year, setYear]           = useState(now.getFullYear());
  const [month, setMonth]         = useState(now.getMonth() + 1);
  const [summary, setSummary]     = useState<PersonalSummary | null>(null);
  const [monthStats, setMonthStats] = useState<PersonalMonthlyStat | null>(null);
  const [history, setHistory]     = useState<AttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const loadMonthData = useCallback(async (y: number, m: number) => {
    try {
      setLoading(true);
      setError(null);
      const [stats, hist] = await Promise.all([
        attendanceService.getMyMonthlyStats(y, m),
        attendanceService.getMyHistory({
          start_date: `${y}-${String(m).padStart(2,'0')}-01`,
          end_date: new Date(y, m, 0).toISOString().split('T')[0],
          limit: 100,
        }),
      ]);
      setMonthStats(stats);
      setHistory(hist);
    } catch {
      setError('Failed to load attendance data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const sum = await attendanceService.getMySummary();
        setSummary(sum);
      } catch {/* ignore summary errors */}
    })();
    loadMonthData(year, month);
  }, []); // eslint-disable-line

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
    loadMonthData(y, m);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-500 mt-1">Track your attendance history and statistics</p>
        </div>

        {/* Summary cards */}
        {summary && <SummaryCards summary={summary} />}

        {/* Calendar / List */}
        <Card>
          {/* Card header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <MonthPicker year={year} month={month} onChange={handleMonthChange} />
            {/* Tab toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden self-start sm:self-auto">
              {(['calendar', 'list'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : (
            <>
              {activeTab === 'calendar' && monthStats && (
                <CalendarHeatMap stats={monthStats} />
              )}
              {activeTab === 'list' && (
                <HistoryTable records={history} />
              )}
            </>
          )}
        </Card>

        {/* Month stats bar */}
        {monthStats && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {MONTHS[month - 1]} {year} — Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Attendance Rate</span>
                <p className="font-bold text-lg text-gray-900">{monthStats.attendance_rate}%</p>
              </div>
              <div>
                <span className="text-gray-500">Total Work Hours</span>
                <p className="font-bold text-lg text-gray-900">{monthStats.total_work_hours}h</p>
              </div>
              <div>
                <span className="text-gray-500">Avg Hours/Day</span>
                <p className="font-bold text-lg text-gray-900">{monthStats.avg_work_hours}h</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};
