/**
 * Dashboard Page — routes to appropriate dashboard based on role
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EmployeeDashboard } from './employee/EmployeeDashboard';
import { AdminDashboard } from './admin/AdminDashboard';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  return user?.role === 'ADMIN' ? <AdminDashboard /> : <EmployeeDashboard />;
};
