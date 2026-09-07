/**
 * Hooks barrel export
 */

export { useCamera }           from './useCamera';
export type { UseCameraReturn, CameraStatus } from './useCamera';

export { useFaceRecognition }  from './useFaceRecognition';
export type { UseFaceRecognitionReturn, RecognitionResult, RecognitionAction } from './useFaceRecognition';

export {
  useAttendance,
  useTodayAttendance,
  useAttendanceSummary,
  useWeeklyStats,
  useMonthlyStats,
  useAttendanceHistory,
  useCheckIn,
  ATTENDANCE_KEYS,
} from './useAttendance';

export {
  useEmployeeList,
  useEmployee,
  useEmployeeStats,
  useUpdateEmployee,
  useDeactivateEmployee,
  EMPLOYEE_KEYS,
} from './useEmployees';

export { useAuth } from './useAuth';
