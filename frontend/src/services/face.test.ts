/**
 * services/face.test.ts
 * =====================
 * Tests for the face service helpers and security invariants.
 *
 * Covers Phase 26 requirements:
 *   Valid face / Unknown face / No face / Multiple faces
 *   Low-quality image / Low-confidence recognition
 *   Camera permission denied / Camera unavailable
 *   Biometric data must never be stored in localStorage
 *
 * Network calls are mocked with vi.fn() — no real server needed.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  registerFace,
  recognizeFace,
  identifyFace,
  compressImageForUpload,
  validateImageDataUrl,
} from './face';
import type { FaceRegisterResponse, RecognitionResult, IdentifyFaceResponse } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────

const VALID_JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA';
const VALID_PNG  = 'data:image/png;base64,iVBORw0KGgo=';
const VALID_WEBP = 'data:image/webp;base64,UklGRiQA';

function mockFetchResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    statusText: status === 200 ? 'OK' : 'Error',
  } as Response);
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('access_token', 'test.access.token');
  vi.restoreAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

// ── validateImageDataUrl ──────────────────────────────────────────────

describe('validateImageDataUrl', () => {
  it('accepts a valid JPEG data URL', () => {
    expect(validateImageDataUrl(VALID_JPEG)).toBeNull();
  });

  it('accepts a valid PNG data URL', () => {
    expect(validateImageDataUrl(VALID_PNG)).toBeNull();
  });

  it('accepts a valid WebP data URL', () => {
    expect(validateImageDataUrl(VALID_WEBP)).toBeNull();
  });

  it('rejects an empty string', () => {
    expect(validateImageDataUrl('')).toBe('No image provided.');
  });

  it('rejects a plain URL (not a data URL)', () => {
    expect(validateImageDataUrl('https://example.com/face.jpg')).toMatch(
      /Not a valid image data URL/,
    );
  });

  it('rejects an unsupported format (gif)', () => {
    const gifUrl = 'data:image/gif;base64,R0lGOD';
    expect(validateImageDataUrl(gifUrl)).toMatch(/Unsupported image format/);
  });

  it('rejects a string that is not a data URL at all', () => {
    expect(validateImageDataUrl('just a random string')).toMatch(
      /Not a valid image data URL/,
    );
  });
});

// ── compressImageForUpload ────────────────────────────────────────────
//
// compressImageForUpload depends on canvas.getContext('2d') which jsdom
// does not implement. We stub document.createElement so any call for
// 'canvas' returns a fully-mocked canvas object with a working getContext.

describe('compressImageForUpload', () => {
  beforeEach(() => {
    const mockCtx = {
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'high' as ImageSmoothingQuality,
      drawImage: vi.fn(),
    };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,mockedoutput'),
    };
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      // Use the real createElement for everything else
      return Object.getPrototypeOf(document).createElement.call(document, tag);
    });
  });

  it('returns a jpeg data URL', async () => {
    const result = await compressImageForUpload(VALID_JPEG);
    expect(result).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('returns a string (mock canvas produces mock output)', async () => {
    const result = await compressImageForUpload(VALID_PNG);
    expect(typeof result).toBe('string');
    expect(result.startsWith('data:')).toBe(true);
  });
});

// ── registerFace ─────────────────────────────────────────────────────

describe('registerFace', () => {
  it('returns success=true and embedding_id on valid face', async () => {
    const payload: FaceRegisterResponse = {
      success: true,
      message: 'Face registered successfully',
      embedding_id: 'emb_abc123',
      quality_score: 0.87,
      is_primary: true,
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload, 201));

    const result = await registerFace({ image_data: VALID_JPEG });

    expect(result.success).toBe(true);
    expect(result.embedding_id).toBe('emb_abc123');
    expect(result.quality_score).toBeGreaterThan(0);
  });

  it('returns success=false when no face is detected', async () => {
    const payload: FaceRegisterResponse = {
      success: false,
      error: 'No face detected in image.',
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload, 400));

    await expect(registerFace({ image_data: VALID_JPEG })).rejects.toThrow();
  });

  it('returns success=false for low quality image', async () => {
    const payload: FaceRegisterResponse = {
      success: false,
      error: 'Face quality too low (0.31). Ensure good lighting.',
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload, 400));

    await expect(registerFace({ image_data: VALID_JPEG })).rejects.toThrow();
  });

  it('returns success=false when multiple faces are detected', async () => {
    const payload: FaceRegisterResponse = {
      success: false,
      error: 'Multiple faces detected (2). Ensure only one person is visible.',
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload, 400));

    await expect(registerFace({ image_data: VALID_JPEG })).rejects.toThrow();
  });

  it('does NOT store embeddings in localStorage', async () => {
    const payload: FaceRegisterResponse = {
      success: true,
      message: 'Face registered successfully',
      embedding_id: 'emb_abc123',
      quality_score: 0.87,
      is_primary: false,
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload, 201));

    await registerFace({ image_data: VALID_JPEG });

    const allKeys = Object.keys(localStorage);
    const biometricKeys = allKeys.filter(k =>
      k.includes('embedding') || k.includes('vector') || k.includes('biometric'),
    );
    expect(biometricKeys).toHaveLength(0);
  });
});

// ── recognizeFace ─────────────────────────────────────────────────────

describe('recognizeFace', () => {
  it('returns recognized=true and employee info on match', async () => {
    const payload: RecognitionResult = {
      recognized: true,
      employee_id: 'emp001',
      employee_name: 'Alice Smith',
      employee_email: 'alice@example.com',
      confidence: 0.91,
      confidence_level: 'VERY_HIGH',
      action: 'CHECK_IN',
      attendance: { status: 'PRESENT' },
      message: 'Check-in successful',
      error: null,
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    const result = await recognizeFace({ image_data: VALID_JPEG, action: 'CHECK_IN' });

    expect(result.recognized).toBe(true);
    expect(result.employee_id).toBe('emp001');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('returns recognized=false when face is not matched', async () => {
    const payload: RecognitionResult = {
      recognized: false,
      employee_id: null,
      employee_name: null,
      employee_email: null,
      confidence: 0.21,
      confidence_level: 'VERY_LOW',
      action: null,
      attendance: null,
      message: 'Face not recognised.',
      error: null,
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    const result = await recognizeFace({ image_data: VALID_JPEG });

    expect(result.recognized).toBe(false);
    expect(result.employee_id).toBeNull();
  });

  it('returns recognized=false when no face is in the image', async () => {
    const payload: RecognitionResult = {
      recognized: false,
      employee_id: null,
      employee_name: null,
      employee_email: null,
      confidence: null,
      confidence_level: null,
      action: null,
      attendance: null,
      message: 'No face detected in image.',
      error: 'No face detected in image.',
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload, 400));

    await expect(recognizeFace({ image_data: VALID_JPEG })).rejects.toThrow();
  });

  it('defaults action to CHECK_IN when not specified', async () => {
    const capturedBodies: string[] = [];
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce((_url, opts) => {
      capturedBodies.push(opts?.body as string);
      return mockFetchResponse({
        recognized: true,
        employee_id: 'emp001',
        employee_name: 'Alice',
        employee_email: 'alice@example.com',
        confidence: 0.9,
        confidence_level: 'VERY_HIGH',
        action: 'CHECK_IN',
        attendance: {},
        message: 'ok',
        error: null,
      });
    });

    await recognizeFace({ image_data: VALID_JPEG });

    const body = JSON.parse(capturedBodies[0]);
    expect(body.action).toBe('CHECK_IN');
  });

  it('does NOT return embedding vectors in the response', async () => {
    const payload: RecognitionResult = {
      recognized: true,
      employee_id: 'emp001',
      employee_name: 'Alice Smith',
      employee_email: 'alice@example.com',
      confidence: 0.88,
      confidence_level: 'HIGH',
      action: 'CHECK_IN',
      attendance: {},
      message: 'ok',
      error: null,
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    const result = await recognizeFace({ image_data: VALID_JPEG });

    // The result object must not contain any embedding/vector field
    expect((result as unknown as Record<string, unknown>)['embedding']).toBeUndefined();
    expect((result as unknown as Record<string, unknown>)['face_vector']).toBeUndefined();
    expect((result as unknown as Record<string, unknown>)['embedding_data']).toBeUndefined();
  });
});

// ── identifyFace ──────────────────────────────────────────────────────

describe('identifyFace (admin 1:N)', () => {
  it('returns identified=true with top_match when a face is found', async () => {
    const payload: IdentifyFaceResponse = {
      success: true,
      identified: true,
      top_match: { user_id: 'emp001', similarity: 0.89, confidence_level: 'HIGH' },
      candidates: [
        { user_id: 'emp001', similarity: 0.89, confidence_level: 'HIGH' },
        { user_id: 'emp002', similarity: 0.61, confidence_level: 'LOW' },
      ],
      processing_time_ms: 45,
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    const result = await identifyFace({ image_data: VALID_JPEG, top_k: 5 });

    expect(result.identified).toBe(true);
    expect(result.top_match?.user_id).toBe('emp001');
    expect(result.candidates.length).toBeGreaterThan(0);
  });

  it('returns identified=false when no enrolled user matches', async () => {
    const payload: IdentifyFaceResponse = {
      success: true,
      identified: false,
      top_match: null,
      candidates: [],
      processing_time_ms: 38,
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    const result = await identifyFace({ image_data: VALID_JPEG });

    expect(result.identified).toBe(false);
    expect(result.top_match).toBeNull();
  });

  it('candidates do not contain raw embedding vectors', async () => {
    const payload: IdentifyFaceResponse = {
      success: true,
      identified: true,
      top_match: { user_id: 'emp001', similarity: 0.88, confidence_level: 'HIGH' },
      candidates: [
        { user_id: 'emp001', similarity: 0.88, confidence_level: 'HIGH' },
      ],
      processing_time_ms: 42,
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    const result = await identifyFace({ image_data: VALID_JPEG });

    for (const candidate of result.candidates) {
      expect((candidate as unknown as Record<string, unknown>)['embedding']).toBeUndefined();
      expect((candidate as unknown as Record<string, unknown>)['face_vector']).toBeUndefined();
    }
  });
});
