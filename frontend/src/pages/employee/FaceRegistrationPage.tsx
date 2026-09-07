/**
 * Employee Face Registration Page  — /employee/face-registration
 *
 * Allows an employee to register (enroll) their face using the live webcam.
 * Calls POST /api/face/register/ — backend decides validity, never the frontend.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import {
  CameraCapture,
  CameraCaptureHandle,
} from '../../components/camera/CameraCapture';
import {
  registerFace,
  getEnrollmentStats,
  compressImageForUpload,
  validateImageDataUrl,
} from '../../services/face';
import type { EnrollmentStats, FaceRegisterResponse } from '../../types';

// ── Step indicator ────────────────────────────────────────────────────

const STEPS = ['Position', 'Capture', 'Register', 'Done'];

const StepBar: React.FC<{ current: number }> = ({ current }) => (
  <ol className="flex items-center gap-0 mb-8" aria-label="Registration steps">
    {STEPS.map((label, i) => {
      const done    = i < current;
      const active  = i === current;
      return (
        <li key={label} className="flex items-center flex-1">
          <div className="flex flex-col items-center w-full">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
              ${done   ? 'bg-green-500 border-green-500 text-white'
              : active ? 'bg-blue-600 border-blue-600 text-white'
              :          'bg-white border-gray-300 text-gray-400'}`}
              aria-current={active ? 'step' : undefined}>
              {done ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : i + 1}
            </div>
            <span className={`text-xs mt-1 font-medium ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-5 transition-colors ${done ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </li>
      );
    })}
  </ol>
);

// ── Main page ─────────────────────────────────────────────────────────

export const FaceRegistrationPage: React.FC = () => {
  const navigate  = useNavigate();
  const cameraRef = useRef<CameraCaptureHandle>(null);

  const [step, setStep]               = useState(0);   // 0=position 1=capture 2=register 3=done
  const [preview, setPreview]         = useState<string | null>(null);
  const [enrollInfo, setEnrollInfo]   = useState<EnrollmentStats | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [result, setResult]           = useState<FaceRegisterResponse | null>(null);
  const [error, setError]             = useState<string | null>(null);

  // Load current enrollment stats
  useEffect(() => {
    getEnrollmentStats()
      .then(setEnrollInfo)
      .catch(() => {})
      .finally(() => setLoadingInfo(false));
  }, []);

  // Handle webcam capture
  const handleCapture = useCallback((dataUrl: string) => {
    setPreview(dataUrl);
    setError(null);
    setStep(1);
  }, []);

  // Re-take photo
  const retake = useCallback(() => {
    setPreview(null);
    setResult(null);
    setError(null);
    setStep(0);
  }, []);

  // Submit to backend
  const submitRegistration = useCallback(async () => {
    if (!preview) return;
    setSubmitting(true);
    setError(null);
    setStep(2);

    try {
      // Validate and compress before upload
      const validationError = validateImageDataUrl(preview);
      if (validationError) {
        setError(validationError);
        setStep(1);
        return;
      }
      const compressed = await compressImageForUpload(preview);

      const res = await registerFace({
        image_data:          compressed,
        is_primary:          !enrollInfo?.has_primary,
        registration_source: 'WEBCAM_CAPTURE',
      });

      setResult(res);
      if (res.success) {
        setStep(3);
        // Refresh enrollment info
        getEnrollmentStats().then(setEnrollInfo).catch(() => {});
      } else {
        setError(res.error ?? 'Registration failed. Please try again.');
        setStep(1);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed. Please try again.';
      setError(msg);
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  }, [preview, enrollInfo]);

  // ── Render ────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Face Registration</h1>
          <p className="text-gray-500 mt-1">
            Register your face so the system can identify you for attendance.
          </p>
        </div>

        {/* Current enrollment status */}
        {!loadingInfo && enrollInfo && (
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Enrollment Status</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {enrollInfo.active_embeddings} face{enrollInfo.active_embeddings !== 1 ? 's' : ''} registered
                  {enrollInfo.average_quality
                    ? ` · avg quality ${(enrollInfo.average_quality * 100).toFixed(0)}%`
                    : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {enrollInfo.has_primary
                  ? <Badge variant="success">Primary set</Badge>
                  : <Badge variant="warning">No primary face</Badge>}
                {enrollInfo.active_embeddings > 0 && (
                  <button
                    onClick={() => navigate('/employee/attendance')}
                    className="text-xs text-blue-600 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-400 rounded"
                  >
                    View history →
                  </button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Step progress */}
        <StepBar current={step} />

        {/* ── STEP 0 & 1: Camera + preview ── */}
        {step < 3 && (
          <Card>
            {step === 0 && (
              <>
                <h2 className="text-sm font-semibold text-gray-700 mb-4">
                  Step 1 — Position your face
                </h2>
                <CameraCapture
                  ref={cameraRef}
                  onCapture={handleCapture}
                  onError={setError}
                  overlayText="Centre your face in the oval · Good lighting · Look directly at the camera"
                  showCaptureButton
                />
              </>
            )}

            {step === 1 && preview && (
              <>
                <h2 className="text-sm font-semibold text-gray-700 mb-4">
                  Step 2 — Review your photo
                </h2>
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={preview}
                    alt="Captured face preview"
                    className="rounded-xl max-h-64 object-contain border border-gray-200 shadow"
                  />

                  {error && (
                    <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm" role="alert">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={retake}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      Retake
                    </button>
                    <button
                      onClick={submitRegistration}
                      disabled={submitting}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {submitting ? 'Registering…' : 'Register Face'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="flex flex-col items-center py-10 gap-3">
                <Spinner size="lg" />
                <p className="text-gray-600 text-sm">Analysing face and registering…</p>
                <p className="text-gray-400 text-xs">This may take a few seconds</p>
              </div>
            )}
          </Card>
        )}

        {/* ── STEP 3: Success ── */}
        {step === 3 && result?.success && (
          <Card>
            <div className="flex flex-col items-center py-8 text-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Face Registered!</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Quality score: <strong>{result.quality_score != null ? `${(result.quality_score * 100).toFixed(0)}%` : '—'}</strong>
                  {result.is_primary && <span className="ml-2 text-blue-600">(set as primary)</span>}
                </p>
              </div>

              {preview && (
                <img src={preview} alt="Registered face" className="w-28 h-28 object-cover rounded-full border-4 border-green-300 shadow" />
              )}

              <p className="text-sm text-gray-600 max-w-sm">
                You can now use face recognition to mark your attendance. Register additional photos for better accuracy.
              </p>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={retake}
                  className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Register Another
                </button>
                <button
                  onClick={() => navigate('/employee/recognition')}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Mark Attendance →
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Tips */}
        <Card>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Tips for best results</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              'Face the camera directly — avoid extreme angles',
              'Use good, even lighting — avoid strong backlighting',
              'Remove sunglasses or hats that obscure your face',
              'Keep a neutral expression',
              'Register in the same environment you will use for check-in',
            ].map(tip => (
              <li key={tip} className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {tip}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  );
};
