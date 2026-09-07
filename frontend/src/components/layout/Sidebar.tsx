/**
 * Sidebar Navigation Component
 * Routes match the spec: /employee/* and /admin/*
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: ('ADMIN' | 'EMPLOYEE')[];
}

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user }  = useAuth();
  const isAdmin   = user?.role === 'ADMIN';

  const employeeNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/employee/dashboard',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    },
    {
      label: 'My Profile',
      path: '/employee/profile',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    },
    {
      label: 'Face Registration',
      path: '/employee/face-registration',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: 'Mark Attendance',
      path: '/employee/recognition',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: 'My Attendance',
      path: '/employee/attendance',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      label: 'Admin Dashboard',
      path: '/admin/dashboard',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>,
      roles: ['ADMIN'],
    },
    {
      label: 'Employees',
      path: '/admin/employees',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      roles: ['ADMIN'],
    },
    {
      label: 'Face Recognition',
      path: '/admin/recognition',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
      roles: ['ADMIN'],
    },
    {
      label: 'Manage Attendance',
      path: '/admin/attendance',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
      roles: ['ADMIN'],
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      roles: ['ADMIN'],
    },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== '/employee/dashboard' && path !== '/admin/dashboard' && location.pathname.startsWith(path));

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">FaceAttend</h1>
        <p className="text-xs text-gray-500 mt-1">Recognition System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {/* Role indicator */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          {isAdmin ? 'Admin Menu' : 'Employee Menu'}
        </p>

        <ul className="space-y-1" role="list">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                aria-current={isActive(item.path) ? 'page' : undefined}
              >
                <span className={isActive(item.path) ? 'text-blue-600' : 'text-gray-400'} aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Quick-register nudge (employees without face) */}
      {!isAdmin && (
        <div className="p-4 border-t border-gray-100">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-900 mb-1">Register your face</p>
            <p className="text-xs text-blue-700 mb-3">Enable face-recognition check-in</p>
            <Link
              to="/employee/face-registration"
              className="block text-center text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-3 py-1.5 font-medium transition-colors"
            >
              Register Now →
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
};
