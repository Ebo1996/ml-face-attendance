/**
 * Attendance Chart Component
 * Simple bar chart for attendance visualization
 */

import React from 'react';
import { Card } from '../common/Card';
import { AttendanceChartData } from '../../data/mockData';

interface AttendanceChartProps {
  data: AttendanceChartData[];
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({ data }) => {
  // Calculate max value for scaling
  const maxValue = Math.max(
    ...data.flatMap(d => [d.present, d.absent, d.late])
  );

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Weekly Attendance Overview</h2>
        <p className="text-sm text-gray-500">Last 7 days attendance statistics</p>
      </div>

      <div className="space-y-4">
        {/* Legend */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-600">Late</span>
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 w-16">{item.date}</span>
                <div className="flex-1 mx-4">
                  <div className="flex gap-1 h-8">
                    {/* Present Bar */}
                    <div
                      className="bg-green-500 rounded transition-all hover:bg-green-600 relative group"
                      style={{ width: `${(item.present / maxValue) * 100}%` }}
                    >
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.present} Present
                      </span>
                    </div>
                    
                    {/* Absent Bar */}
                    <div
                      className="bg-red-500 rounded transition-all hover:bg-red-600 relative group"
                      style={{ width: `${(item.absent / maxValue) * 100}%` }}
                    >
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.absent} Absent
                      </span>
                    </div>
                    
                    {/* Late Bar */}
                    <div
                      className="bg-yellow-500 rounded transition-all hover:bg-yellow-600 relative group"
                      style={{ width: `${(item.late / maxValue) * 100}%` }}
                    >
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.late} Late
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-gray-500 w-32 justify-end">
                  <span className="text-green-600 font-medium">{item.present}</span>
                  <span className="text-red-600 font-medium">{item.absent}</span>
                  <span className="text-yellow-600 font-medium">{item.late}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
