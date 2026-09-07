/**
 * Profile Info Component - View Mode
 */

import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { User } from '../../services/auth';

interface ProfileInfoProps {
  user: User;
  onEdit: () => void;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ user, onEdit }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
        <button
          onClick={onEdit}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-600 hover:border-blue-700 rounded-lg transition-colors"
        >
          Edit Profile
        </button>
      </div>

      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
          <Avatar
            fallback={user.email.charAt(0).toUpperCase()}
            size="xl"
          />
          <div>
            <h3 className="text-lg font-medium text-gray-900">{user.email}</h3>
            <Badge variant={user.role === 'ADMIN' ? 'success' : 'default'}>
              {user.role}
            </Badge>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Email Address
            </label>
            <p className="text-base text-gray-900">{user.email}</p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Role
            </label>
            <p className="text-base text-gray-900">{user.role}</p>
          </div>

          {/* Account Status */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Account Status
            </label>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-base text-gray-900">
                {user.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          {/* Date Joined */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Member Since
            </label>
            <p className="text-base text-gray-900">{user.date_joined ? formatDate(user.date_joined) : '—'}</p>
          </div>

          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              User ID
            </label>
            <p className="text-base text-gray-900 font-mono text-sm">{user.id}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
