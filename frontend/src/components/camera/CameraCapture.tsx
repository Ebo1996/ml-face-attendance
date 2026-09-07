/**
 * CameraCapture Component
 *
 * Provides a live webcam feed using the Browser MediaDevices API.
 * Allows capturing a single frame as a base64 data URL.
 *
 * Props:
 *   onCapture(dataUrl)  - called when the user clicks "Capture"
 *   onError(message)    - called when camera access fails
 *   width / height      - video dimensions (default 640×480)
 *   autoStart           - start camera on mount (default true)
 *   overlayText         - instruction text shown over the video feed
 */

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';

export interface CameraCaptureHandle {
  capture: () => string | null;
  startCamera: () => void;
  stopCamera: () => void;
}

interface CameraCaptureProps {
  onCapture?: (dataUrl: string) => void;
  onError?: (message: string) => void;
  width?: number;
  height?: number;
  autoStart?: boolean;
  overlayText?: string;
  showCaptureButton?: boolean;
  className?: string;
}

const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(
  (
    {
      onCapture,
      onError,
      width = 640,
      height = 480,
      autoStart = true,
      overlayText = 'Position your face in the frame',
      showCaptureButton = true,
      className = '',
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [status, setStatus] = useState<'idle' | 'requesting' | 'active' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // ── Start camera ──────────────────────────────────────────────────
    const startCamera = useCallback(async () => {
      setStatus('requesting');
      setErrorMessage(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        const msg = 'Camera not supported in this browser.';
        setErrorMessage(msg);
        setStatus('error');
        onError?.(msg);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: width }, height: { ideal: height }, facingMode: 'user' },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus('active');
      } catch (err: unknown) {
        let msg = 'Camera access failed.';
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError') msg = 'Camera permission denied. Please allow camera access and try again.';
          else if (err.name === 'NotFoundError') msg = 'No camera found. Please connect a camera and try again.';
          else if (err.name === 'NotReadableError') msg = 'Camera is already in use by another application.';
        }
        setErrorMessage(msg);
        setStatus('error');
        onError?.(msg);
      }
    }, [width, height, onError]);

    // ── Stop camera ───────────────────────────────────────────────────
    const stopCamera = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setStatus('idle');
    }, []);

    // ── Capture frame ─────────────────────────────────────────────────
    const capture = useCallback((): string | null => {
      if (!videoRef.current || !canvasRef.current || status !== 'active') return null;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || width;
      canvas.height = video.videoHeight || height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Mirror the image (selfie mode)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onCapture?.(dataUrl);
      return dataUrl;
    }, [status, width, height, onCapture]);

    // Expose handle to parent via ref
    useImperativeHandle(ref, () => ({ capture, startCamera, stopCamera }), [
      capture, startCamera, stopCamera,
    ]);

    // Auto-start on mount
    useEffect(() => {
      if (autoStart) startCamera();
      return () => stopCamera();
    }, []); // eslint-disable-line

    // ── Render ────────────────────────────────────────────────────────
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        {/* Video feed */}
        <div className="relative rounded-xl overflow-hidden bg-gray-900 shadow-lg"
             style={{ width: '100%', maxWidth: width, aspectRatio: `${width}/${height}` }}>

          {/* Live video — mirrored for natural selfie view */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
            muted
            playsInline
            aria-label="Camera feed"
          />

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

          {/* Face-guide oval overlay */}
          {status === 'active' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-4 border-white/50 rounded-full"
                   style={{ width: '55%', height: '75%', boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)' }} />
            </div>
          )}

          {/* Overlay instruction text */}
          {status === 'active' && overlayText && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-white text-sm text-center">{overlayText}</p>
            </div>
          )}

          {/* Status overlays */}
          {status === 'requesting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-white text-sm">Requesting camera access…</p>
            </div>
          )}

          {status === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90">
              <svg className="w-16 h-16 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-sm">Camera off</p>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 p-4">
              <svg className="w-12 h-12 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-400 text-sm text-center">{errorMessage}</p>
              <button
                onClick={startCamera}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Capture button */}
        {showCaptureButton && status === 'active' && (
          <button
            onClick={capture}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Capture photo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Capture Photo
          </button>
        )}

        {/* Camera toggle */}
        {status !== 'requesting' && (
          <div className="flex gap-2 text-xs">
            {status !== 'active' && (
              <button onClick={startCamera}
                className="text-blue-600 hover:text-blue-700 underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded">
                Start Camera
              </button>
            )}
            {status === 'active' && (
              <button onClick={stopCamera}
                className="text-gray-500 hover:text-gray-700 underline focus:outline-none focus:ring-1 focus:ring-gray-400 rounded">
                Stop Camera
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

CameraCapture.displayName = 'CameraCapture';
export { CameraCapture };
