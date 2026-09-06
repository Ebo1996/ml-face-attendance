/**
 * Security Settings Component
 */

import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { PasswordChangeModal } from './PasswordChangeModal';

export const SecuritySettings: React.FC = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handlePasswordChangeSuccess = () => {
    setSuccessMessage('Password changed successfully!');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  return (
    <>
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Password Section */}
          <div className="flex items-start justify-between pb-6 border-b border-gray-200">
            <div className="flex-1">
              <h3 className="text-base font-medium text-gray-900 mb-1">Password</h3>
              <p className="text-sm text-gray-500">
                Update your password to keep your account secure
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Last changed: Never
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPasswordModal(true)}
            >
              Change Password
            </Button>
          </div>

          {/* Two-Factor Authentication */}
          <div className="flex items-start justify-between pb-6 border-b border-gray-200">
            <div className="flex-1">
              <h3 className="text-base font-medium text-gray-900 mb-1">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-500">
                Add an extra layer of security to your account
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Not Enabled
                </span>
              </div>
            </div>
            <Button variant="outline" disabled>
              Enable 2FA
              <span className="ml-2 text-xs text-gray-400">(Coming Soon)</span>
            </Button>
          </div>

          {/* Active Sessions */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-base font-medium text-gray-900 mb-1">Active Sessions</h3>
              <p className="text-sm text-gray-500">
                Manage devices where you're currently logged in
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Current Device</p>
                    <p className="text-xs text-gray-500">Last active: Just now</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
    </>
  );
};
