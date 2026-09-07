/**
 * Admin Recognition Page  (Phase 16)
 *
 * Admin uploads or captures a photo → system identifies the employee via
 * 1:N face matching → admin can mark their attendance directly.
 */

import React, { useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import {
  identifyFace,
  compressImageForUpload,
  validateImageDataUrl,
} from '../../services/face';
import type { IdentifyFaceResponse, IdentifyCandidate } from '../../types';
import { apiClient } from '../../services/api';

// ── Types ─────────────────────────────────────────────────────────────

interface EmployeeInfo {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface MarkResult {
  success: boolean;
  action?: string;
  message?: string;
  error?: string;
  attendance?: Record<string, unknown>;
}

// ── Helpers ───────────────────────────────────────────────────────────

const CONFIDENCE_COLORS: Record<string, string> = {
  VERY_HIGH: 'bg-green-100 text-green-700 border-green-200',
  HIGH:      'bg-blue-100 text-blue-700 border-blue-200',
  MEDIUM:    'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW:       'bg-orange-100 text-orange-700 border-orange-200',
  VERY_LOW:  'bg-red-100 text-red-700 border-red-200',
};

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'LATE',    label: 'Late' },
  { value: 'HALF_DAY', label: 'Half Day' },
];

function pct(sim: number) { return `${Math.round(sim * 100)}%`; }

// ── Main Component ────────────────────────────────────────────────────

export const AdminRecognitionPage: React.FC = () => {
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const [preview, setPreview]           = useState<string | null>(null);
  const [imageData, setImageData]       = useState<string | null>(null);
  const [identifying, setIdentifying]   = useState(false);
  const [result, setResult]             = useState<IdentifyFaceResponse | null>(null);
  const [employees, setEmployees]       = useState<Record<string, EmployeeInfo>>({});
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [markStatus, setMarkStatus]     = useState<'PRESENT' | 'LATE' | 'HALF_DAY'>('PRESENT');
  const [marking, setMarking]           = useState(false);
  const [markResult, setMarkResult]     = useState<MarkResult | null>(null);
  const [error, setError]               = useState<string | null>(null);

  // ── Image handling ──────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please upload an image file.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      setPreview(data);
      setImageData(data);
      setResult(null);
      setMarkResult(null);
      setSelectedId(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  // ── Identify face ───────────────────────────────────────────────────

  const identify = async () => {
    if (!imageData) return;
    setIdentifying(true);
    setError(null);
    setResult(null);
    setMarkResult(null);
    try {
      // Validate then compress before upload
      const validationError = validateImageDataUrl(imageData);
      if (validationError) { setError(validationError); return; }
      const compressed = await compressImageForUpload(imageData);

      const res = await identifyFace({ image_data: compressed, top_k: 5 });
      setResult(res);

      // Fetch employee info for each candidate
      if (res.candidates?.length) {
        const infos: Record<string, EmployeeInfo> = {};
        await Promise.allSettled(
          res.candidates.map(async (c: IdentifyCandidate) => {
            try {
              const emp = await apiClient.get<EmployeeInfo>(`/employees/${c.user_id}/`);
              infos[c.user_id] = emp;
            } catch { /* skip */ }
          })
        );
        setEmployees(infos);
      }

      // Pre-select top match
      if (res.top_match) setSelectedId(res.top_match.user_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Face identification failed');
    } finally {
      setIdentifying(false);
    }
  };

  // ── Mark attendance ─────────────────────────────────────────────────

  const markAttendance = async () => {
    if (!selectedId) return;
    setMarking(true);
    setMarkResult(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await apiClient.post<MarkResult>('/attendance/admin/mark/', {
        user_id:        selectedId,
        date:           today,
        status:         markStatus,
        check_in_time:  new Date().toISOString(),
      });
      setMarkResult(res);
    } catch (e: unknown) {
      setMarkResult({ success: false, error: e instanceof Error ? e.message : 'Failed to mark attendance' });
    } finally {
      setMarking(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setImageData(null);
    setResult(null);
    setMarkResult(null);
    setSelectedId(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Render ────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Face Recognition</h1>
          <p className="text-gray-500 mt-1">Upload a photo to identify an employee and mark attendance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left — image upload */}
          <Card>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Upload Photo</h2>

            {/* Drop zone */}
            {!preview ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center
                           hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 text-sm">Drag & drop or <span className="text-blue-600 font-medium">browse</span></p>
                <p className="text-gray-400 text-xs mt-1">PNG, JPG, JPEG supported</p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full rounded-xl object-cover max-h-72"
                />
                <button
                  onClick={reset}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  aria-label="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button
                variant="default"
                onClick={identify}
                disabled={!imageData || identifying}
                className="flex-1"
              >
                {identifying ? (
                  <><Spinner size="sm" className="mr-2" /> Identifying...</>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Identify Face
                  </>
                )}
              </Button>
              {preview && (
                <Button variant="outline" onClick={reset}>Reset</Button>
              )}
            </div>

            {result && (
              <p className="text-xs text-gray-400 mt-2 text-right">
                Processed in {result.processing_time_ms.toFixed(0)}ms
              </p>
            )}
          </Card>

          {/* Right — results */}
          <div className="space-y-4">
            {/* No result yet */}
            {!result && !identifying && (
              <Card>
                <div className="text-center py-10 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0M19 21a7 7 0 10-14 0" />
                  </svg>
                  <p className="text-sm">Upload a photo and click Identify Face</p>
                </div>
              </Card>
            )}

            {/* Not identified */}
            {result && !result.identified && (
              <Card>
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-700">No match found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {result.error ?? 'No enrolled employee matches this face'}
                  </p>
                </div>
              </Card>
            )}

            {/* Candidates */}
            {result?.identified && result.candidates.length > 0 && (
              <Card>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  Matches ({result.candidates.length})
                </h2>
                <div className="space-y-2">
                  {result.candidates.map((c) => {
                    const emp = employees[c.user_id];
                    const isSelected = selectedId === c.user_id;
                    return (
                      <button
                        key={c.user_id}
                        onClick={() => setSelectedId(c.user_id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {emp?.full_name ?? `User ${c.user_id.slice(0, 8)}`}
                            </p>
                            {emp && (
                              <p className="text-xs text-gray-500">{emp.email}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-gray-800">{pct(c.similarity)}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CONFIDENCE_COLORS[c.confidence_level] ?? ''}`}>
                              {c.confidence_level.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        {/* Similarity bar */}
                        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: pct(c.similarity) }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Mark attendance */}
            {selectedId && result?.identified && (
              <Card>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Mark Attendance</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Selected Employee</label>
                    <p className="text-sm font-medium text-gray-800">
                      {employees[selectedId]?.full_name ?? selectedId}
                    </p>
                    {employees[selectedId] && (
                      <p className="text-xs text-gray-500">{employees[selectedId].email}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
                    <div className="flex gap-2">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setMarkStatus(opt.value as typeof markStatus)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            markStatus === opt.value
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="default"
                    onClick={markAttendance}
                    disabled={marking}
                    className="w-full"
                  >
                    {marking ? <><Spinner size="sm" className="mr-2" />Marking…</> : 'Mark Attendance'}
                  </Button>

                  {markResult && (
                    <div className={`p-3 rounded-lg text-sm ${
                      markResult.success
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-600'
                    }`}>
                      {markResult.success
                        ? (markResult.message ?? 'Attendance marked successfully')
                        : (markResult.error ?? 'Failed to mark attendance')}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
