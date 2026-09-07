/**
 * Admin Employee Detail Page — /admin/employees/:id
 *
 * Shows full profile, attendance history, face registration status
 * and allows editing / activating / deactivating the employee.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { employeeService, Employee } from '../../services/employees';
import { attendanceService, AttendanceRecord } from '../../services/attendance';
import { apiClient } from '../../services/api';

// ── helpers ───────────────────────────────────────────────────────────

const fmtDate  = (d?: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtTime  = (iso?: string | null) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'default' | 'danger'> = {
  PRESENT: 'success', LATE: 'warning', HALF_DAY: 'default', ABSENT: 'danger', ON_LEAVE: 'default',
};
const STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present', LATE: 'Late', HALF_DAY: 'Half Day', ABSENT: 'Absent', ON_LEAVE: 'On Leave',
};

interface FaceStats {
  active_embeddings: number;
  has_primary: boolean;
  average_quality?: number;
  total_embeddings: number;
}

// ── Edit Modal ────────────────────────────────────────────────────────

interface EditModalProps {
  employee: Employee;
  onClose: () => void;
  onSaved: (updated: Employee) => void;
}

const EditModal: React.FC<EditModalProps> = ({ employee, onClose, onSaved }) => {
  const [firstName, setFirstName]   = useState(employee.profile?.first_name ?? '');
  const [lastName,  setLastName]    = useState(employee.profile?.last_name  ?? '');
  const [phone,     setPhone]       = useState(employee.profile?.phone       ?? '');
  const [dept,      setDept]        = useState(employee.profile?.department  ?? '');
  const [position,  setPosition]    = useState(employee.profile?.position    ?? '');
  const [role,      setRole]        = useState<'ADMIN' | 'EMPLOYEE'>(employee.role);
  const [saving,    setSaving]      = useState(false);
  const [error,     setError]       = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await employeeService.updateEmployee(employee.id, {
        first_name: firstName, last_name: lastName,
        phone, department: dept, position, role,
      });
      onSaved(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit Employee">
      <div className="space-y-4 mt-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
            <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
            <Input value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
            <Input value={dept} onChange={e => setDept(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
            <Input value={position} onChange={e => setPosition(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value as 'ADMIN' | 'EMPLOYEE')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
        )}
        <div className="flex gap-2 pt-1">
          <Button variant="default" onClick={save} disabled={saving} className="flex-1">
            {saving ? <><Spinner size="sm" className="mr-2" />Saving…</> : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
};

// ── Main page ──────────────────────────────────────────────────────────

export const EmployeeDetailPage: React.FC = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employee,    setEmployee]    = useState<Employee | null>(null);
  const [faceStats,   setFaceStats]   = useState<FaceStats | null>(null);
  const [records,     setRecords]     = useState<AttendanceRecord[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [showEdit,    setShowEdit]    = useState(false);
  const [toggling,    setToggling]    = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [emp, hist] = await Promise.all([
        employeeService.getEmployee(id),
        attendanceService.getEmployeeHistory(id, { limit: 10 }),
      ]);
      setEmployee(emp);
      setRecords((hist as { records?: AttendanceRecord[] }).records ?? []);

      // Face stats
      const fs = await apiClient.get<FaceStats>(`/face/enrollment-stats/?user_id=${id}`).catch(() => null);
      if (fs) setFaceStats(fs);
    } catch {
      setError('Failed to load employee details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async () => {
    if (!employee) return;
    setToggling(true);
    try {
      if (employee.is_active) {
        await employeeService.deleteEmployee(employee.id);
        setEmployee({ ...employee, is_active: false });
      } else {
        const updated = await employeeService.updateEmployee(employee.id, { is_active: true });
        setEmployee(updated);
      }
    } catch {
      alert('Failed to update employee status.');
    } finally {
      setToggling(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !employee) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <p className="text-red-500 mb-4">{error ?? 'Employee not found.'}</p>
          <Button variant="outline" onClick={() => navigate('/admin/employees')}>← Back to Employees</Button>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = employee.full_name || employee.email;
  const initial  = fullName.charAt(0).toUpperCase();

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb">
          <button
            onClick={() => navigate('/admin/employees')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Employees
          </button>
        </nav>

        {/* Profile header */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {employee.profile?.avatar ? (
                <img src={employee.profile.avatar} alt={fullName}
                     className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {initial}
                </div>
              )}

              {/* Info */}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
                <p className="text-gray-500 text-sm">{employee.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={employee.role === 'ADMIN' ? 'warning' : 'default'}>
                    {employee.role}
                  </Badge>
                  <Badge variant={employee.is_active ? 'success' : 'danger'}>
                    {employee.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {faceStats && (
                    <Badge variant={faceStats.active_embeddings > 0 ? 'success' : 'default'}>
                      {faceStats.active_embeddings > 0 ? `Face ×${faceStats.active_embeddings}` : 'No Face'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" onClick={() => setShowEdit(true)}>Edit</Button>
              <Button
                variant={employee.is_active ? 'destructive' : 'default'}
                onClick={toggleActive}
                disabled={toggling}
              >
                {toggling
                  ? <Spinner size="sm" />
                  : employee.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Detail grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile details */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Profile Details</h2>
            <dl className="space-y-3">
              {([
                ['Employee ID',   employee.profile?.employee_id ?? '—'],
                ['Department',    employee.profile?.department  || '—'],
                ['Position',      employee.profile?.position    || '—'],
                ['Phone',         employee.profile?.phone       || '—'],
                ['Joined',        fmtDate(employee.date_joined)],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-800 text-right max-w-[60%] truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Face registration */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Face Registration</h2>
            {faceStats ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Registered faces</span>
                  <span className="font-medium text-gray-800">{faceStats.active_embeddings}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Primary face set</span>
                  <span className={`font-medium ${faceStats.has_primary ? 'text-green-600' : 'text-red-500'}`}>
                    {faceStats.has_primary ? 'Yes' : 'No'}
                  </span>
                </div>
                {faceStats.average_quality != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Average quality</span>
                    <span className="font-medium text-gray-800">
                      {(faceStats.average_quality * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {faceStats.active_embeddings === 0 && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                    This employee has not registered their face yet. They will not be able to use face recognition for attendance.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Face data unavailable</p>
            )}
          </Card>
        </div>

        {/* Recent attendance */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Recent Attendance (Last 10)</h2>
            <button
              onClick={() => navigate(`/admin/attendance?user_id=${employee.id}`)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View all →
            </button>
          </div>

          {records.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">No attendance records yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2 px-3 font-medium">Date</th>
                    <th className="py-2 px-3 font-medium">Status</th>
                    <th className="py-2 px-3 font-medium">Check In</th>
                    <th className="py-2 px-3 font-medium">Check Out</th>
                    <th className="py-2 px-3 font-medium">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-3 text-gray-700">{fmtDate(r.date)}</td>
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
        </Card>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <EditModal
          employee={employee}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { setEmployee(updated); setShowEdit(false); }}
        />
      )}
    </DashboardLayout>
  );
};
