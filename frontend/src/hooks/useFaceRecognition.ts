/**
 * useFaceRecognition
 *
 * Encapsulates the full face-recognition flow:
 *   capture image → POST /api/face/recognize/ → handle result.
 *
 * Usage
 * -----
 *   const { recognize, result, loading, reset } = useFaceRecognition();
 *   const dataUrl = camera.capture();
 *   await recognize(dataUrl, 'CHECK_IN');
 */

import { useState, useCallback } from 'react';
import { apiClient } from '../services/api';

// ── Types (kept here; canonical source is src/types/index.ts) ─────────

export interface RecognitionResult {
  recognized:       boolean;
  employee_id:      string | null;
  employee_name:    string | null;
  employee_email:   string | null;
  confidence:       number | null;
  confidence_level: string | null;
  action:           string | null;
  attendance:       Record<string, unknown> | null;
  message:          string;
  error:            string | null;
}

export type RecognitionAction = 'CHECK_IN' | 'CHECK_OUT';

export interface UseFaceRecognitionReturn {
  result:    RecognitionResult | null;
  loading:   boolean;
  recognize: (imageData: string, action?: RecognitionAction) => Promise<RecognitionResult>;
  reset:     () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useFaceRecognition(): UseFaceRecognitionReturn {
  const [result,  setResult]  = useState<RecognitionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const recognize = useCallback(
    async (imageData: string, action: RecognitionAction = 'CHECK_IN'): Promise<RecognitionResult> => {
      setLoading(true);
      try {
        const res = await apiClient.post<RecognitionResult>('/face/recognize/', {
          image_data: imageData,
          action,
        });
        setResult(res);
        return res;
      } catch (err: unknown) {
        const errResult: RecognitionResult = {
          recognized:       false,
          employee_id:      null,
          employee_name:    null,
          employee_email:   null,
          confidence:       null,
          confidence_level: null,
          action:           null,
          attendance:       null,
          message: err instanceof Error ? err.message : 'Network error. Please try again.',
          error:   'NETWORK_ERROR',
        };
        setResult(errResult);
        return errResult;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => setResult(null), []);

  return { result, loading, recognize, reset };
}
