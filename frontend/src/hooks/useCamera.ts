/**
 * useCamera
 *
 * Manages a webcam stream lifecycle (open / close / capture).
 * Provides a base64 JPEG string suitable for POSTing to the backend.
 *
 * Usage
 * -----
 *   const { videoRef, status, error, startCamera, stopCamera, capture } = useCamera();
 *
 * The component should render:
 *   <video ref={videoRef} muted playsInline />
 */

import { useRef, useState, useCallback, useEffect } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error';

export interface UseCameraReturn {
  videoRef:    React.RefObject<HTMLVideoElement>;
  canvasRef:   React.RefObject<HTMLCanvasElement>;
  status:      CameraStatus;
  error:       string | null;
  startCamera: () => Promise<void>;
  stopCamera:  () => void;
  /** Capture current frame → base64 JPEG data URL, or null if camera not active */
  capture:     (quality?: number) => string | null;
}

export function useCamera(autoStart = false): UseCameraReturn {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error,  setError]  = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setStatus('requesting');
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = 'Camera not supported in this browser.';
      setError(msg);
      setStatus('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
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
        if (err.name === 'NotAllowedError')
          msg = 'Camera permission denied. Please allow access and try again.';
        else if (err.name === 'NotFoundError')
          msg = 'No camera found. Please connect a camera.';
        else if (err.name === 'NotReadableError')
          msg = 'Camera is in use by another application.';
      }
      setError(msg);
      setStatus('error');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
  }, []);

  const capture = useCallback((quality = 0.92): string | null => {
    if (status !== 'active' || !videoRef.current || !canvasRef.current) return null;

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Mirror for selfie-mode
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    return canvas.toDataURL('image/jpeg', quality);
  }, [status]);

  // Auto-start on mount if requested
  useEffect(() => {
    if (autoStart) startCamera();
    return () => stopCamera();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { videoRef, canvasRef, status, error, startCamera, stopCamera, capture };
}
