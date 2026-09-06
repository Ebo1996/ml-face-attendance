/**
 * Welcome Section Component
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../common/Badge';

export const WelcomeSection: React.FC = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">
              {getGreeting()}, {user?.email?.split('@')[0]}!
            </h1>
            <Badge variant="success" className="bg-white text-blue-600">
              {user?.role}
            </Badge>
          </div>
          <p className="text-blue-100 text-lg mb-4">{getTodayDate()}</p>
          <p className="text-blue-50 max-w-2xl">
            Welcome to your attendance dashboard. Track your attendance, view reports, and manage your profile all in one place.
          </p>
        </div>

        <div className="flex-shrink-0">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-1">
                {new Date().getDate()}
              </div>
              <div className="text-sm text-blue-100">
                {new Date().toLocaleDateString('en-US', { month: 'short' })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
