/**
 * Employee Recognition Page — /employee/recognition
 *
 * Employee uses the live webcam to mark their own attendance
 * via POST /api/face/recognize/ (1:1 verification against themselves).
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { CameraCapture, CameraCaptureHandle } from '../../components/camera/CameraCapture';
import { apiClient } from '../../services/api';
import { attendanceService, TodayStatus } from '../../services/attendance';

// ── Types ──────────────────────────────────────────────────────────────

interface RecognitionResult {
  recognized: boolean;
  employee_id: string | null;
  employee_name: string | null;
  confidence: number | null;
  confidence_level: string | null;
  action: string | null;
  attendance: Record<string, unknown> | null;
  message: string;
  error: string | null;
}

type UIState = 'camera' | 'processing' | 'success' | 'failed';

// ── Status detail card ─────────────────────────────────────────────────

const TodayCard: React.FC<{ status: TodayStatus }> = ({ status }) => {
  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  const STATUS_COLOR: Record<string, string> = {
    PRESENT: 'text-green-600', LATE: 'text-yellow-600',
    HALF_DAY: 'text-blue-600', ABSENT: 'text-red-600', ON_LEAVE: 'text-gray-600',
  };
  const STATUS_LABEL: Record<string, string> = {
    PRESENT: 'Present', LATE: 'Late', HALF_DAY: 'Half Day', ABSENT: 'Absent', ON_LEAVE: 'On Leave',
  };

  if (!status.has_record) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
        <span className="text-sm text-gray-600">Not checked in today</span>
      </div>
    );
  }

  const att = status.attendance!;
  const s = att.status as string;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm">
      <div>
        <p className="text-xs text-gray-500">Status</p>
        <p className={`font-semibold ${STATUS_COLOR[s] ?? 'text-gray-700'}`}>{STATUS_LABEL[s] ?? s}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Check In</p>
        <p className="font-semibold text-gray-800">{fmt(att.check_in_time as string ?? null)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Check Out</p>
        <p className="font-semibold text-gray-800">{fmt(att.check_out_time as string ?? null)}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Hours</p>
        <p className="font-semibold text-gray-800">
          {att.work_hours != null ? `${att.work_hours}h` : '—'}
        </p>
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────

export const RecognitionPage: React.FC = () => {
  const navigate  = useNavigate();
  const cameraRef = useRef<CameraCaptureHandle>(null);

  const [uiState, setUiState]       = useState<UIState>('camera');
  const [action, setAction]         = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [result, setResult]         = useState<RecognitionResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Load today's status to determine which action to show
  useEffect(() => {
    attendanceService.getTodayStatus()
      .then(s => {
        setTodayStatus(s);
        setAction(s.is_checked_in && !s.is_checked_out ? 'CHECK_OUT' : 'CHECK_IN');
      })
      .catch(() => {});
  }, []);

  // Capture and submit
  const handleCapture = useCallback(async (dataUrl: string) => {
    setUiState('processing');
    setCameraError(null);

    try {
      const res = await apiClient.post<RecognitionResult>('/face/recognize/', {
        image_data: dataUrl,
        action,
      });

      setResult(res);
      setUiState(res.recognized ? 'success' : 'failed');

      // Refresh today status
      if (res.recognized) {
        attendanceService.getTodayStatus().then(setTodayStatus).catch(() => {});
      }
    } catch (e: unknown) {
      setResult({
        recognized: false,
        employee_id: null,
        employee_name: null,
        confidence: null,
        confidence_level: null,
        action: null,
        attendance: null,
        message: e instanceof Error ? e.message : 'Network error. Please try again.',
        error: 'network_error',
      });
      setUiState('failed');
    }
  }, [action]);

  const retry = useCallback(() => {
    setResult(null);
    setUiState('camera');
  }, []);

  // ── Result icons ────────────────────────────────────────────────────

  const SuccessIcon = () => (
    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );

  const FailIcon = () => (
    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
      <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="p-6 max-w-xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {action === 'CHECK_IN' ? 'Check In' : 'Check Out'}
          </h1>
          <p className="text-gray-500 mt-1">
            {action === 'CHECK_IN'
              ? 'Look at the camera to mark your arrival'
              : 'Look at the camera to mark your departure'}
          </p>
        </div>

        {/* Today status */}
        {todayStatus && <TodayCard status={todayStatus} />}

        {/* Action toggle */}
        {todayStatus && (
          <div className="flex rounded-xl border border-gray-200 overflow-hidden self-start">
            {(['CHECK_IN', 'CHECK_OUT'] as const).map(a => (
              <button
                key={a}
                onClick={() => { setAction(a); retry(); }}
                className={`px-5 py-2 text-sm font-medium transition-colors ${
                  action === a ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {a === 'CHECK_IN' ? 'Check In' : 'Check Out'}
              </button>
            ))}
          </div>
        )}

        {/* Camera / processing / result */}
        <Card>
          {uiState === 'camera' && (
            <>
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Position your face and click Capture
              </h2>
              <CameraCapture
                ref={cameraRef}
                onCapture={handleCapture}
                onError={setCameraError}
                overlayText="Look directly at the camera · Good lighting · Single face only"
                showCaptureButton
              />
              {cameraError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm" role="alert">
                  {cameraError}
                  {!cameraError.toLowerCase().includes('permission') && (
                    <p className="mt-1 text-xs">
                      No camera?{' '}
                      <button
                        onClick={() => navigate('/employee/attendance')}
                        className="underline text-red-700 hover:text-red-800"
                      >
                        View attendance history instead
                      </button>
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {uiState === 'processing' && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Spinner size="lg" />
              <p className="text-gray-600 font-medium">Verifying your identity…</p>
              <p className="text-gray-400 text-xs">Please hold still</p>
            </div>
          )}

          {uiState === 'success' && result && (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <SuccessIcon />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {action === 'CHECK_IN' ? 'Checked In!' : 'Checked Out!'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{result.message}</p>
              </div>

              {result.confidence != null && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Confidence:</span>
                  <Badge variant={
                    result.confidence >= 0.90 ? 'success'
                    : result.confidence >= 0.70 ? 'warning'
                    : 'default'
                  }>
                    {(result.confidence * 100).toFixed(0)}% — {result.confidence_level?.replace('_', ' ')}
                  </Badge>
                </div>
              )}

              {todayStatus && <TodayCard status={todayStatus} />}

              <div className="flex gap-3 mt-2 w-full">
                <button
                  onClick={retry}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  {action === 'CHECK_IN' ? 'Check Out Later' : 'Done'}
                </button>
                <button
                  onClick={() => navigate('/employee/attendance')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium"
                >
                  View Attendance →
                </button>
              </div>
            </div>
          )}

          {uiState === 'failed' && result && (
            <div className="flex flex-col items-center py-8 gap-4 text-center">
              <FailIcon />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Not Recognised</h2>
                <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">{result.message}</p>
              </div>

              {/* Helpful error guidance */}
              <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 text-left">
                <p className="font-semibold mb-2">Try these tips:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Improve lighting — avoid backlighting</li>
                  <li>Remove sunglasses or hat</li>
                  <li>Face the camera directly</li>
                  <li>Ensure only your face is in frame</li>
                  {!result.recognized && (
                    <li>
                      Not registered?{' '}
                      <button
                        onClick={() => navigate('/employee/face-registration')}
                        className="underline font-semibold hover:text-amber-900"
                      >
                        Register your face first
                      </button>
                    </li>
                  )}
                </ul>
              </div>

              <button
                onClick={retry}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
              >
                Try Again
              </button>
            </div>
          )}
        </Card>

        {/* Face not registered prompt */}
        {uiState === 'camera' && todayStatus !== null && (
          <p className="text-center text-sm text-gray-500">
            First time?{' '}
            <button
              onClick={() => navigate('/employee/face-registration')}
              className="text-blue-600 hover:text-blue-700 underline font-medium"
            >
              Register your face
            </button>
          </p>
        )}
      </div>
    </DashboardLayout>
  );
};
