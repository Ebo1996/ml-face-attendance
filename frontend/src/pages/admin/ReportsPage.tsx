/**
 * Reports Page  (Phase 19)
 * Admin / Employee can generate and download CSV attendance reports
 */

import React, { useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function buildUrl(path: string, params: Record<string, string>) {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => Boolean(v)))
  );
  return `${API_BASE}${path}?${q.toString()}`;
}

async function downloadCsv(url: string, filename: string) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'PRESENT', label: 'Present' },
  { value: 'LATE', label: 'Late' },
  { value: 'HALF_DAY', label: 'Half Day' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'ON_LEAVE', label: 'On Leave' },
];

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [status, setStatus]       = useState('');
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage]     = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setStartDate(`${y}-${m}-01`);
    setEndDate(new Date(y, now.getMonth() + 1, 0).toISOString().split('T')[0]);
  };

  const download = async (forAdmin: boolean) => {
    setDownloading(true);
    setMessage(null);
    try {
      const path  = forAdmin ? '/attendance/export/admin/' : '/attendance/export/my/';
      const fname = forAdmin ? 'attendance_report.csv' : 'my_attendance.csv';
      const url   = buildUrl(path, { start_date: startDate, end_date: endDate, status });
      await downloadCsv(url, fname);
      setMessage({ type: 'success', text: 'Report downloaded successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to generate report. Please try again.' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Generate and export attendance reports as CSV</p>
        </div>

        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Report Filters</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            {isAdmin && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={currentMonth} className="text-xs">
                This Month
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {/* Personal report (all users) */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">My Attendance Report</h3>
                <p className="text-sm text-gray-500 mt-0.5">Export your own attendance history</p>
              </div>
              <Button variant="default" onClick={() => download(false)} disabled={downloading}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CSV
              </Button>
            </div>
          </Card>

          {/* Admin full export */}
          {isAdmin && (
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">Company Attendance Report</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Export all employees (max 5,000 rows)</p>
                </div>
                <Button variant="default" onClick={() => download(true)} disabled={downloading}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download CSV
                </Button>
              </div>
            </Card>
          )}
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        {/* CSV format reference */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">CSV Format</h2>
          <div className="overflow-x-auto">
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {['Date', 'Status', 'Check In', 'Check Out', 'Work Hours', 'Method', 'Notes'].map(h => (
                    <th key={h} className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {['2026-09-06', 'PRESENT', '09:02', '17:31', '8.48', 'FACE_RECOGNITION', ''].map((v, i) => (
                    <td key={i} className="border border-gray-200 px-3 py-2 text-gray-600">{v || '—'}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
