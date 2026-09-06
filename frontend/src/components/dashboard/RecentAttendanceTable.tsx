/**
 * Recent Attendance Table Component
 */

import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { AttendanceRecord, statusLabels } from '../../data/mockData';

interface RecentAttendanceTableProps {
  records: AttendanceRecord[];
}

export const RecentAttendanceTable: React.FC<RecentAttendanceTableProps> = ({ records }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusVariant = (status: AttendanceRecord['status']) => {
    const variantMap = {
      present: 'success' as const,
      late: 'warning' as const,
      absent: 'danger' as const,
      'half-day': 'info' as const,
    };
    return variantMap[status];
  };

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Attendance</h2>
        <p className="text-sm text-gray-500">Your latest attendance records</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Check In</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Check Out</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Location</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  No attendance records found
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {formatDate(record.date)}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">
                    {record.checkIn}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700">
                    {record.checkOut || (
                      <span className="text-gray-400 italic">Not marked</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={getStatusVariant(record.status)}>
                      {statusLabels[record.status]}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {record.location || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {records.length > 0 && (
        <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Showing {records.length} recent records
          </p>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </button>
        </div>
      )}
    </Card>
  );
};
