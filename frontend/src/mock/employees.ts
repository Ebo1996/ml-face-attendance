/**
 * mock/employees.ts
 * =================
 * Realistic mock employees used during development / Storybook / tests.
 * Never imported in production code paths that talk to the real API.
 */

import type { Employee, EmployeeListItem, EmployeeStats } from '../types';

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    email: 'sarah.johnson@acme.com',
    role: 'EMPLOYEE',
    is_active: true,
    date_joined: '2023-03-15T08:00:00Z',
    full_name: 'Sarah Johnson',
    profile: {
      first_name: 'Sarah',
      last_name: 'Johnson',
      phone: '+1-555-0101',
      department: 'Engineering',
      position: 'Senior Frontend Developer',
      employee_id: 'EMP-001',
      avatar: null,
      created_at: '2023-03-15T08:00:00Z',
      updated_at: '2024-01-10T09:30:00Z',
    },
  },
  {
    id: 'emp-002',
    email: 'michael.chen@acme.com',
    role: 'EMPLOYEE',
    is_active: true,
    date_joined: '2022-09-01T08:00:00Z',
    full_name: 'Michael Chen',
    profile: {
      first_name: 'Michael',
      last_name: 'Chen',
      phone: '+1-555-0102',
      department: 'Engineering',
      position: 'Backend Engineer',
      employee_id: 'EMP-002',
      avatar: null,
      created_at: '2022-09-01T08:00:00Z',
      updated_at: '2024-02-05T14:00:00Z',
    },
  },
  {
    id: 'emp-003',
    email: 'priya.patel@acme.com',
    role: 'EMPLOYEE',
    is_active: true,
    date_joined: '2023-06-20T08:00:00Z',
    full_name: 'Priya Patel',
    profile: {
      first_name: 'Priya',
      last_name: 'Patel',
      phone: '+1-555-0103',
      department: 'Product',
      position: 'Product Manager',
      employee_id: 'EMP-003',
      avatar: null,
      created_at: '2023-06-20T08:00:00Z',
      updated_at: '2024-01-22T11:00:00Z',
    },
  },
  {
    id: 'emp-004',
    email: 'james.okafor@acme.com',
    role: 'EMPLOYEE',
    is_active: true,
    date_joined: '2021-11-08T08:00:00Z',
    full_name: 'James Okafor',
    profile: {
      first_name: 'James',
      last_name: 'Okafor',
      phone: '+1-555-0104',
      department: 'Design',
      position: 'UX Designer',
      employee_id: 'EMP-004',
      avatar: null,
      created_at: '2021-11-08T08:00:00Z',
      updated_at: '2023-12-01T10:15:00Z',
    },
  },
  {
    id: 'emp-005',
    email: 'emily.santos@acme.com',
    role: 'EMPLOYEE',
    is_active: false,
    date_joined: '2020-07-14T08:00:00Z',
    full_name: 'Emily Santos',
    profile: {
      first_name: 'Emily',
      last_name: 'Santos',
      phone: '+1-555-0105',
      department: 'Marketing',
      position: 'Marketing Specialist',
      employee_id: 'EMP-005',
      avatar: null,
      created_at: '2020-07-14T08:00:00Z',
      updated_at: '2024-03-01T08:00:00Z',
    },
  },
  {
    id: 'adm-001',
    email: 'admin@acme.com',
    role: 'ADMIN',
    is_active: true,
    date_joined: '2020-01-01T08:00:00Z',
    full_name: 'Alex Rivera',
    profile: {
      first_name: 'Alex',
      last_name: 'Rivera',
      phone: '+1-555-0100',
      department: 'HR',
      position: 'HR Manager',
      employee_id: 'ADM-001',
      avatar: null,
      created_at: '2020-01-01T08:00:00Z',
      updated_at: '2024-01-01T08:00:00Z',
    },
  },
];

export const MOCK_EMPLOYEE_LIST_ITEMS: EmployeeListItem[] = MOCK_EMPLOYEES.map(e => ({
  id:         e.id,
  email:      e.email,
  role:       e.role,
  is_active:  e.is_active,
  full_name:  e.full_name,
  department: e.profile?.department ?? '',
  position:   e.profile?.position   ?? '',
}));

export const MOCK_EMPLOYEE_STATS: EmployeeStats = {
  total_employees:    6,
  active_employees:   5,
  inactive_employees: 1,
  admin_count:        1,
  employee_count:     5,
  departments: [
    { department: 'Engineering', count: 2 },
    { department: 'Product',     count: 1 },
    { department: 'Design',      count: 1 },
    { department: 'Marketing',   count: 1 },
    { department: 'HR',          count: 1 },
  ],
};
