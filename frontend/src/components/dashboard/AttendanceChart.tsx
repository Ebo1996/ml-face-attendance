/**
 * Attendance Chart Component
 */

import React from 'react';
import { Card } from '../common/Card';

export interface AttendanceChartData {
  day?: string;
  date?: string;
  present: number;
  absent: number;
  late: number;
  hours?: number;
}

interface AttendanceChartProps {
  data: AttendanceChartData[];
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({ data }) => {
  const maxValue = Math.max(1, ...data.flatMap(d => [d.present, d.absent, d.late]));

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Weekly Attendance Overview</h2>
        <p className="text-sm text-gray-500">This week's attendance breakdown</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-6 text-sm">
          {[['bg-green-500', 'Present'], ['bg-red-500', 'Absent'], ['bg-yellow-500', 'Late']].map(([cls, label]) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-3 h-3 ${cls} rounded`} />
              <span className="text-gray-600">{label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {data.map((item, index) => {
            const label = item.day ?? item.date ?? `Day ${index + 1}`;
            return (
              <div key={index}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 w-12">{label}</span>
                  <div className="flex-1 mx-4 flex gap-1 h-7">
                    {[
                      { val: item.present, cls: 'bg-green-500 hover:bg-green-600', tip: `${item.present} Present` },
                      { val: item.absent,  cls: 'bg-red-500 hover:bg-red-600',   tip: `${item.absent} Absent` },
                      { val: item.late,    cls: 'bg-yellow-500 hover:bg-yellow-600', tip: `${item.late} Late` },
                    ].map(({ val, cls, tip }) => (
                      <div
                        key={tip}
                        className={`${cls} rounded transition-all relative group`}
                        style={{ width: `${(val / maxValue) * 100}%`, minWidth: val ? 4 : 0 }}
                        title={tip}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3 text-xs w-24 justify-end">
                    <span className="text-green-600 font-medium">{item.present}</span>
                    <span className="text-red-600 font-medium">{item.absent}</span>
                    <span className="text-yellow-600 font-medium">{item.late}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
