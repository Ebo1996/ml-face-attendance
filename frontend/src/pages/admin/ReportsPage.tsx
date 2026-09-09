/**
 * Reports Page - Professional & Modern UI
 * Generate and download attendance reports with advanced filtering
 */

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

interface ReportStats {
  totalRecords: number;
  dateRange: string;
  estimatedSize: string;
}

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');

  // UI state
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);

  useEffect(() => {
    // Set default to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    // Update stats when filters change
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      setReportStats({
        totalRecords: isAdmin ? days * 50 : days, // Estimate
        dateRange: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
        estimatedSize: isAdmin ? `${Math.round(days * 5)}KB` : `${Math.round(days * 0.5)}KB`,
      });
    }
  }, [startDate, endDate, isAdmin]);

  const buildUrl = (path: string, params: Record<string, string>) => {
    const q = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => Boolean(v)))
    );
    return `${API_BASE}${path}?${q.toString()}`;
  };

  const downloadCsv = async (url: string, filename: string) => {
    const token = localStorage.getItem('access_token');
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Download failed' }));
      throw new Error(err.error || 'Download failed');
    }
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleDownload = async (forAdmin: boolean) => {
    if (!startDate || !endDate) {
      setMessage({ type: 'error', text: 'Please select both start and end dates' });
      return;
    }

    setDownloading(true);
    setMessage(null);
    
    try {
      const path = forAdmin ? '/attendance/export/admin/' : '/attendance/export/my/';
      const filename = forAdmin 
        ? `attendance_report_${startDate}_${endDate}.csv` 
        : `my_attendance_${startDate}_${endDate}.csv`;
      
      const params: Record<string, string> = {
        start_date: startDate,
        end_date: endDate,
      };
      
      if (forAdmin) {
        if (status) params.status = status;
        if (userId) params.user_id = userId;
      }
      
      const url = buildUrl(path, params);
      await downloadCsv(url, filename);
      
      setMessage({ type: 'success', text: `Report downloaded successfully as ${filename}` });
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to generate report. Please try again.' });
    } finally {
      setDownloading(false);
    }
  };

  const setPresetRange = (preset: 'today' | 'week' | 'month' | 'year') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        start = end = now;
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>
                <p className="text-gray-600 mt-2">Generate and download attendance data as CSV files</p>
              </div>
              <div className="hidden md:block">
                <svg className="w-16 h-16 text-blue-100" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Success/Error Message */}
          {message && (
            <div className={`rounded-xl p-4 flex items-start gap-3 shadow-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {message.type === 'success' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          {/* Filters Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Report Filters</h2>

            {/* Quick Presets */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Quick Date Range</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Today', value: 'today' },
                  { label: 'Last 7 Days', value: 'week' },
                  { label: 'This Month', value: 'month' },
                  { label: 'This Year', value: 'year' },
                ].map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => setPresetRange(preset.value as any)}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Start Date
                  </div>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    End Date
                  </div>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>

            {/* Admin Filters */}
            {isAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Attendance Status
                    </div>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="">All Statuses</option>
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="HALF_DAY">Half Day</option>
                    <option value="ABSENT">Absent</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Employee ID (Optional)
                    </div>
                  </label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Filter by specific employee"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Report Stats Preview */}
            {reportStats && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Estimated Records</p>
                    <p className="text-2xl font-bold text-blue-600">{reportStats.totalRecords}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date Range</p>
                    <p className="text-xs font-semibold text-gray-900 mt-1">{reportStats.dateRange}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">File Size</p>
                    <p className="text-2xl font-bold text-indigo-600">{reportStats.estimatedSize}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Download Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Report */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 md:p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">My Attendance Report</h3>
                  <p className="text-blue-100 text-sm">Export your personal data</p>
                </div>
              </div>
              <p className="text-blue-100 mb-6 text-sm">
                Download your complete attendance history with check-in/out times, work hours, and status records.
              </p>
              <button
                onClick={() => handleDownload(false)}
                disabled={downloading}
                className="w-full bg-white text-blue-600 py-3.5 rounded-xl font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download My Report
                  </>
                )}
              </button>
            </div>

            {/* Admin Report */}
            {isAdmin && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 md:p-8 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Company-Wide Report</h3>
                    <p className="text-indigo-100 text-sm">Export all employee data</p>
                  </div>
                </div>
                <p className="text-indigo-100 mb-6 text-sm">
                  Generate comprehensive attendance reports for all employees with advanced filtering options. Max 5,000 records.
                </p>
                <button
                  onClick={() => handleDownload(true)}
                  disabled={downloading}
                  className="w-full bg-white text-indigo-600 py-3.5 rounded-xl font-bold text-lg hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {downloading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Company Report
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* CSV Format Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              CSV File Format
            </h2>
            <p className="text-gray-600 mb-4">Your report will include the following columns:</p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Column</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Date', 'Attendance date', '2026-09-07'],
                    ['Status', 'PRESENT, LATE, HALF_DAY, ABSENT, ON_LEAVE', 'PRESENT'],
                    ['Check In', 'Check-in time (24-hour format)', '09:02'],
                    ['Check Out', 'Check-out time (24-hour format)', '17:31'],
                    ['Work Hours', 'Total hours worked', '8.48'],
                    ['Method', 'FACE_RECOGNITION or MANUAL', 'FACE_RECOGNITION'],
                    ['Notes', 'Additional notes or comments', 'On time'],
                    ...(isAdmin ? [
                      ['Employee', 'Employee full name', 'John Doe'],
                      ['Email', 'Employee email address', 'john@company.com'],
                      ['Admin Override', 'Manual entry by admin', 'Yes/No'],
                    ] : []),
                  ].map(([col, desc, ex], i) => (
                    <tr key={i} className="hover:bg-blue-50 transition-colors">
                      <td className="border border-gray-200 px-4 py-3 font-medium text-gray-900">{col}</td>
                      <td className="border border-gray-200 px-4 py-3 text-gray-600">{desc}</td>
                      <td className="border border-gray-200 px-4 py-3 text-gray-500 font-mono text-xs">{ex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">💡 Tip:</span> You can open CSV files in Excel, Google Sheets, or any spreadsheet application for further analysis and reporting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
