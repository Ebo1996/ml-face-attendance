/**
 * Password Change Modal Component
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { authService } from '../../services/auth';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.old_password) {
      newErrors.old_password = 'Current password is required';
    }

    if (!formData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.new_password)) {
      newErrors.new_password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.new_password_confirm) {
      newErrors.new_password_confirm = 'Please confirm your new password';
    } else if (formData.new_password !== formData.new_password_confirm) {
      newErrors.new_password_confirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setGeneralError('');

    try {
      await authService.changePassword(formData);
      
      // Clear form
      setFormData({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Password change error:', error);
      
      if (error.errors) {
        setErrors(error.errors);
      } else {
        setGeneralError(error.message || 'Failed to change password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
      setErrors({});
      setGeneralError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Password"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General Error */}
        {generalError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="text-sm">{generalError}</p>
          </div>
        )}

        {/* Current Password */}
        <div>
          <label htmlFor="old_password" className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <Input
            id="old_password"
            name="old_password"
            type="password"
            value={formData.old_password}
            onChange={handleChange}
            placeholder="Enter current password"
            error={errors.old_password}
            disabled={isLoading}
            autoComplete="current-password"
          />
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <Input
            id="new_password"
            name="new_password"
            type="password"
            value={formData.new_password}
            onChange={handleChange}
            placeholder="Enter new password"
            error={errors.new_password}
            disabled={isLoading}
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-gray-500">
            Min 8 characters with uppercase, lowercase, and number
          </p>
        </div>

        {/* Confirm New Password */}
        <div>
          <label htmlFor="new_password_confirm" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <Input
            id="new_password_confirm"
            name="new_password_confirm"
            type="password"
            value={formData.new_password_confirm}
            onChange={handleChange}
            placeholder="Confirm new password"
            error={errors.new_password_confirm}
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Change Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};
