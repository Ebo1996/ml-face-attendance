/**
 * useEmployees
 *
 * TanStack Query–based hooks for employee data.
 *
 * Usage
 * -----
 *   const { data, isLoading } = useEmployeeList({ search: 'John' });
 *   const { data: emp }       = useEmployee(id);
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService, EmployeeSearchParams, EmployeeUpdateData } from '../services/employees';

// ── Query keys ────────────────────────────────────────────────────────

export const EMPLOYEE_KEYS = {
  all:    ['employees'] as const,
  list:   (params: EmployeeSearchParams) => ['employees', 'list', params] as const,
  detail: (id: string) => ['employees', 'detail', id] as const,
  stats:  ['employees', 'stats'] as const,
};

// ── List ──────────────────────────────────────────────────────────────

export function useEmployeeList(params: EmployeeSearchParams = {}) {
  return useQuery({
    queryKey: EMPLOYEE_KEYS.list(params),
    queryFn:  () => employeeService.getEmployees(params),
    staleTime: 2 * 60_000,
  });
}

// ── Detail ────────────────────────────────────────────────────────────

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: EMPLOYEE_KEYS.detail(id ?? ''),
    queryFn:  () => employeeService.getEmployee(id!),
    enabled:  Boolean(id),
    staleTime: 5 * 60_000,
  });
}

// ── Stats ─────────────────────────────────────────────────────────────

export function useEmployeeStats() {
  return useQuery({
    queryKey: EMPLOYEE_KEYS.stats,
    queryFn:  () => employeeService.getStats(),
    staleTime: 5 * 60_000,
  });
}

// ── Update mutation ───────────────────────────────────────────────────

export function useUpdateEmployee(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: EmployeeUpdateData) => employeeService.updateEmployee(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(EMPLOYEE_KEYS.detail(id), updated);
      qc.invalidateQueries({ queryKey: EMPLOYEE_KEYS.all });
    },
  });
}

// ── Deactivate mutation ───────────────────────────────────────────────

export function useDeactivateEmployee() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeeService.deleteEmployee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMPLOYEE_KEYS.all });
    },
  });
}
