/**
 * Employee API Service
 */

import { apiClient } from './api';

export interface EmployeeProfile {
  first_name: string;
  last_name: string;
  phone: string;
  department: string;
  position: string;
  employee_id: string | null;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  is_active: boolean;
  date_joined: string;
  full_name: string;
  profile?: EmployeeProfile;
}

export interface EmployeeListItem {
  id: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  is_active: boolean;
  full_name: string;
  department: string;
  position: string;
}

export interface EmployeeStats {
  total_employees: number;
  active_employees: number;
  inactive_employees: number;
  admin_count: number;
  employee_count: number;
  departments: Array<{
    department: string;
    count: number;
  }>;
}

export interface EmployeeSearchParams {
  search?: string;
  role?: 'ADMIN' | 'EMPLOYEE';
  department?: string;
  is_active?: boolean;
}

export interface EmployeeUpdateData {
  email?: string;
  role?: 'ADMIN' | 'EMPLOYEE';
  is_active?: boolean;
  first_name?: string;
  last_name?: string;
  phone?: string;
  department?: string;
  position?: string;
  employee_id?: string | null;
}

export const employeeService = {
  /**
   * Get list of employees with optional filters
   */
  async getEmployees(params?: EmployeeSearchParams): Promise<EmployeeListItem[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.department) searchParams.append('department', params.department);
    if (params?.is_active !== undefined) {
      searchParams.append('is_active', params.is_active.toString());
    }
    
    const query = searchParams.toString();
    const url = query ? `/employees/?${query}` : '/employees/';
    
    return await apiClient.get<EmployeeListItem[]>(url);
  },

  /**
   * Get employee details by ID
   */
  async getEmployee(id: string): Promise<Employee> {
    return await apiClient.get<Employee>(`/employees/${id}/`);
  },

  /**
   * Update employee information (admin only)
   */
  async updateEmployee(id: string, data: EmployeeUpdateData): Promise<Employee> {
    return await apiClient.patch<Employee>(`/employees/${id}/update/`, data);
  },

  /**
   * Deactivate employee (soft delete)
   */
  async deleteEmployee(id: string): Promise<{ message: string }> {
    return await apiClient.delete<{ message: string }>(`/employees/${id}/delete/`);
  },

  /**
   * Get employee statistics
   */
  async getStats(): Promise<EmployeeStats> {
    return await apiClient.get<EmployeeStats>('/employees/stats/');
  },

  /**
   * Update own profile
   */
  async updateOwnProfile(data: Partial<EmployeeProfile>): Promise<Employee> {
    return await apiClient.patch<Employee>('/employees/profile/update/', data);
  },

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<{ message: string; avatar_url: string | null }> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employees/profile/avatar/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload avatar');
    }

    return await response.json();
  },
};
