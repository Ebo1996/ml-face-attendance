/**
 * Mock Data for Dashboard
 * Will be replaced with real API data in Phase 18
 */

export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: 'present' | 'late' | 'absent' | 'half-day';
  location?: string;
}

export interface DashboardStats {
  todayStatus: 'present' | 'absent' | 'not-marked';
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  attendanceRate: number;
  thisMonthPresent: number;
  thisMonthTotal: number;
  totalEmployees: number;
}

export interface AttendanceChartData {
  date: string;
  present: number;
  absent: number;
  late: number;
}

// Generate last 7 days attendance chart data
export const getAttendanceChartData = (): AttendanceChartData[] => {
  const data: AttendanceChartData[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      present: Math.floor(Math.random() * 10) + 85, // 85-95
      absent: Math.floor(Math.random() * 5) + 2,    // 2-7
      late: Math.floor(Math.random() * 8) + 3,      // 3-11
    });
  }
  
  return data;
};

// Mock recent attendance records
export const mockRecentAttendance: AttendanceRecord[] = [
  {
    id: '1',
    date: new Date().toISOString(),
    checkIn: '09:05 AM',
    checkOut: '05:30 PM',
    status: 'present',
    location: 'Office - Main Building',
  },
  {
    id: '2',
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    checkIn: '09:15 AM',
    checkOut: '05:45 PM',
    status: 'late',
    location: 'Office - Main Building',
  },
  {
    id: '3',
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    checkIn: '08:55 AM',
    checkOut: '05:20 PM',
    status: 'present',
    location: 'Office - Main Building',
  },
  {
    id: '4',
    date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    checkIn: '09:00 AM',
    checkOut: '02:00 PM',
    status: 'half-day',
    location: 'Office - Main Building',
  },
  {
    id: '5',
    date: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    checkIn: '08:50 AM',
    checkOut: '05:25 PM',
    status: 'present',
    location: 'Office - Main Building',
  },
];

// Mock dashboard statistics
export const mockDashboardStats: DashboardStats = {
  todayStatus: 'present',
  totalPresent: 142,
  totalAbsent: 8,
  totalLate: 15,
  attendanceRate: 94.6,
  thisMonthPresent: 18,
  thisMonthTotal: 20,
  totalEmployees: 165,
};

// Status color mappings
export const statusColors = {
  present: 'success',
  late: 'warning',
  absent: 'destructive',
  'half-day': 'info',
  'not-marked': 'default',
} as const;

// Status labels
export const statusLabels = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
  'half-day': 'Half Day',
  'not-marked': 'Not Marked',
} as const;
