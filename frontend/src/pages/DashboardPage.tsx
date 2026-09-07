/**
 * DashboardPage — redirects to role-appropriate dashboard
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const DashboardPage = () => {
  const { user } = useAuth();
  return (
    <Navigate
      to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard'}
      replace
    />
  );
};
