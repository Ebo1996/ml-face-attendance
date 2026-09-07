/**
 * services/employees.ts
 * =====================
 * Employee CRUD API service.
 *
 * All types are imported from types/index.ts (single source of truth).
 * Named re-exports keep every existing consumer import working.
 */

import { apiClient } from './api';
import type {
  Employee,
  EmployeeProfile,
  EmployeeListItem,
  EmployeeStats,
  EmployeeSearchParams,
  EmployeeUpdateData,
} from '../types';

// ── Backwards-compat re-exports ───────────────────────────────────────
export type {
  Employee,
  EmployeeProfile,
  EmployeeListItem,
  EmployeeStats,
  EmployeeSearchParams,
  EmployeeUpdateData,
};

// ── Service ───────────────────────────────────────────────────────────

export const employeeService = {
  /** List employees with optional search / filter params. Admin only. */
  async getEmployees(params?: EmployeeSearchParams): Promise<EmployeeListItem[]> {
    const q = new URLSearchParams();
    if (params?.search)                q.append('search',    params.search);
    if (params?.role)                  q.append('role',      params.role);
    if (params?.department)            q.append('department', params.department);
    if (params?.is_active !== undefined) q.append('is_active', String(params.is_active));
    const qs = q.toString();
    return apiClient.get<EmployeeListItem[]>(qs ? `/employees/?${qs}` : '/employees/');
  },

  /** Get a single employee by ID. */
  async getEmployee(id: string): Promise<Employee> {
    return apiClient.get<Employee>(`/employees/${id}/`);
  },

  /** Update employee info (admin only). */
  async updateEmployee(id: string, data: EmployeeUpdateData): Promise<Employee> {
    return apiClient.patch<Employee>(`/employees/${id}/update/`, data);
  },

  /** Soft-delete (deactivate) an employee. Admin only. */
  async deleteEmployee(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/employees/${id}/delete/`);
  },

  /** Aggregate counts / department breakdown. Admin only. */
  async getStats(): Promise<EmployeeStats> {
    return apiClient.get<EmployeeStats>('/employees/stats/');
  },

  /** Update the authenticated user's own profile fields. */
  async updateOwnProfile(data: Partial<EmployeeProfile>): Promise<Employee> {
    return apiClient.patch<Employee>('/employees/profile/update/', data);
  },

  /** Upload avatar image for the authenticated user. */
  async uploadAvatar(file: File): Promise<{ message: string; avatar_url: string | null }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'}/employees/profile/avatar/`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: formData,
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? 'Failed to upload avatar');
    }

    return response.json();
  },
};
