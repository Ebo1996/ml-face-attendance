/**
 * Admin Attendance Management Page  (Phase 17)
 *
 * Paginated filterable table of all attendance records.
 * Admins can search by employee, filter by status/date, and manually
 * mark / edit attendance via a modal.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { Modal } from '../../components/common/Modal';
import { attendanceService, AttendanceRecord, PaginatedAttendance } from '../../services/attendance';
import { employeeService, EmployeeListItem } from '../../services/employees';
import { apiClient } from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
  PRESENT: 'success', LATE: 'warning', HALF_DAY: 'info', ABSENT: 'danger', ON_LEAVE: 'default',
};
const STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present', LATE: 'Late', HALF_DAY: 'Half Day', ABSENT: 'Absent', ON_LEAVE: 'On Leave',
};
const STATUS_OPTIONS = ['', 'PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE'];

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
function todayStr() { return new Date().toISOString().split('T')[0]; }

// ── Mark Attendance Modal ─────────────────────────────────────────────

interface MarkModalProps {
  employees: EmployeeListItem[];
  prefillRecord?: AttendanceRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const MarkModal: React.FC<MarkModalProps> = ({ employees, prefillRecord, onClose, onSuccess }) => {
  const [userId, setUserId]         = useState(prefillRecord?.user_email ? '' : '');
  const [date, setDate]             = useState(prefillRecord?.date ?? todayStr());
  const [attendanceStatus, setAttendanceStatus] = useState<string>(prefillRecord?.status ?? 'PRESENT');
  const [checkIn, setCheckIn]       = useState(prefillRecord?.check_in_time?.slice(0, 16) ?? '');
  const [checkOut, setCheckOut]     = useState(prefillRecord?.check_out_time?.slice(0, 16) ?? '');
  const [notes, setNotes]           = useState(prefillRecord?.notes ?? '');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Find user_id by email if editing
  useEffect(() => {
    if (prefillRecord) {
      const emp = employees.find(e => e.email === prefillRecord.user_email);
      if (emp) setUserId(emp.id);
    }
  }, [prefillRecord, employees]);

  const save = async () => {
    if (!userId || !date || !attendanceStatus) { setError('Please fill in all required fields.'); return; }
    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/attendance/admin/mark/', {
        user_id:        userId,
        date,
        status:         attendanceStatus,
        check_in_time:  checkIn ? new Date(checkIn).toISOString() : undefined,
        check_out_time: checkOut ? new Date(checkOut).toISOString() : undefined,
        notes,
      });
      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={prefillRecord ? 'Edit Attendance' : 'Mark Attendance'}>
      <div className="space-y-4 mt-2">
        {/* Employee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
          <select
            value={userId}
            onChange={e => setUserId(e.target.value)}
            disabled={!!prefillRecord}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select employee…</option>
            {Array.isArray(employees) && employees.map(e => (
              <option key={e.id} value={e.id}>{e.full_name || e.email} — {e.email}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.filter(Boolean).map(s => (
              <button
                key={s}
                onClick={() => setAttendanceStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  attendanceStatus === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check-in time</label>
            <Input type="datetime-local" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check-out time</label>
            <Input type="datetime-local" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Optional notes…"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="default" onClick={save} disabled={saving} className="flex-1">
            {saving ? <><Spinner size="sm" className="mr-2" />Saving…</> : 'Save'}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────

export const AttendanceManagementPage: React.FC = () => {
  const [data, setData]                 = useState<PaginatedAttendance | null>(null);
  const [employees, setEmployees]       = useState<EmployeeListItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]             = useState(1);
  const PAGE_SIZE = 20;

  // Modal
  const [showModal, setShowModal]         = useState(false);
  const [editRecord, setEditRecord]       = useState<AttendanceRecord | null>(null);

  const load = useCallback(async (p = page) => {
    try {
      setLoading(true);
      setError(null);
      const result = await attendanceService.getAdminList({
        start_date: startDate || undefined,
        end_date:   endDate   || undefined,
        status:     statusFilter || undefined,
        page:       p,
        page_size:  PAGE_SIZE,
      });
      setData(result);
      setPage(p);
    } catch {
      setError('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter, page]);

  useEffect(() => {
    load(1);
    employeeService.getEmployees().then(data => {
      // Handle both array and paginated response
      const employeesList = Array.isArray(data) ? data : (data as any)?.results || [];
      setEmployees(employeesList);
    }).catch(() => {
      setEmployees([]);
    });
  }, []); // eslint-disable-line

  const applyFilters = () => load(1);
  const clearFilters = () => {
    setStartDate(''); setEndDate(''); setStatusFilter('');
    setTimeout(() => load(1), 0);
  };
  const openNew   = () => { setEditRecord(null); setShowModal(true); };
  const openEdit  = (r: AttendanceRecord) => { setEditRecord(r); setShowModal(true); };
  const onSuccess = () => { setShowModal(false); load(page); };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-500 mt-1">View, filter, and manually manage attendance records</p>
          </div>
          <Button variant="default" onClick={openNew}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Mark Attendance
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.filter(Boolean).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="default" onClick={applyFilters} className="flex-1">Apply</Button>
              <Button variant="outline" onClick={clearFilters}>Clear</Button>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                <span>{data?.total ?? 0} total records</span>
                <span>Page {data?.page ?? 1} / {data?.total_pages ?? 1}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      <th className="py-3 px-3 font-semibold">Employee</th>
                      <th className="py-3 px-3 font-semibold">Date</th>
                      <th className="py-3 px-3 font-semibold">Status</th>
                      <th className="py-3 px-3 font-semibold">Check In</th>
                      <th className="py-3 px-3 font-semibold">Check Out</th>
                      <th className="py-3 px-3 font-semibold">Hours</th>
                      <th className="py-3 px-3 font-semibold">Source</th>
                      <th className="py-3 px-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.records ?? []).map((r) => (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-medium text-gray-800">{r.user_name}</div>
                          <div className="text-xs text-gray-500">{r.user_email}</div>
                        </td>
                        <td className="py-3 px-3 text-gray-700">{fmtDate(r.date)}</td>
                        <td className="py-3 px-3">
                          <Badge variant={STATUS_VARIANTS[r.status] ?? 'default'}>
                            {STATUS_LABELS[r.status] ?? r.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{fmtTime(r.check_in_time)}</td>
                        <td className="py-3 px-3 text-gray-600">{fmtTime(r.check_out_time)}</td>
                        <td className="py-3 px-3 text-gray-600">
                          {r.work_hours != null ? `${r.work_hours}h` : '—'}
                        </td>
                        <td className="py-3 px-3 text-gray-500 text-xs capitalize">
                          {r.admin_override ? (
                            <span className="text-blue-600 font-medium">Admin</span>
                          ) : (
                            r.check_in_method?.replace(/_/g, ' ').toLowerCase()
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => openEdit(r)}
                            className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {(!data?.records?.length) && (
                  <div className="text-center py-12 text-gray-500">No records found</div>
                )}
              </div>

              {/* Pagination */}
              {data && data.total_pages > 1 && (
                <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => load(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(data.total_pages, 7) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button
                        key={p}
                        onClick={() => load(p)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                          p === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => load(page + 1)}
                    disabled={page >= data.total_pages}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Mark/Edit Modal */}
      {showModal && (
        <MarkModal
          employees={employees}
          prefillRecord={editRecord}
          onClose={() => setShowModal(false)}
          onSuccess={onSuccess}
        />
      )}
    </DashboardLayout>
  );
};
