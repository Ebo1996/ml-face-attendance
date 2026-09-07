/**
 * services/face.ts
 * ================
 * All face-biometric API calls: enrollment and recognition.
 *
 * SECURITY RULES enforced here:
 *   - Raw face embeddings are NEVER returned or stored.
 *   - The backend is always authoritative — this layer only sends images
 *     and surfaces the server's decision.
 *   - No biometric data is placed in localStorage or sessionStorage.
 *
 * Endpoints
 * ---------
 *   POST /api/face/register/          — enroll the authenticated employee's face
 *   POST /api/face/recognize/         — identify a person + record attendance (admin 1:N)
 *   POST /api/face/identify/          — 1:N identification without marking attendance
 *   GET  /api/face/enrollment-stats/  — current enrollment info for the authed user
 *   GET  /api/face/embeddings/        — list own embeddings (no vectors returned)
 *   DELETE /api/face/embeddings/{id}/ — soft-delete one embedding
 */

import { apiClient } from './api';
import type {
  FaceRegisterRequest,
  FaceRegisterResponse,
  RecognitionResult,
  EnrollmentStats,
  FaceEmbeddingInfo,
  RecognitionAction,
  IdentifyCandidate,
  IdentifyFaceRequest,
  IdentifyFaceResponse,
} from '../types';

// ── Enrollment ────────────────────────────────────────────────────────

/**
 * Register (enroll) the authenticated employee's face.
 *
 * `imageData` must be a base64 data-URL captured from the webcam.
 * The backend validates face presence, quality, and uniqueness.
 * Raw embeddings are never returned.
 */
export async function registerFace(
  params: FaceRegisterRequest,
): Promise<FaceRegisterResponse> {
  return apiClient.post<FaceRegisterResponse>('/face/register/', params);
}

/**
 * Fetch enrollment statistics for the currently authenticated user.
 * Returns counts and quality metrics — no embedding vectors.
 */
export async function getEnrollmentStats(): Promise<EnrollmentStats> {
  return apiClient.get<EnrollmentStats>('/face/enrollment-stats/');
}

/**
 * List all face embeddings belonging to the authenticated user.
 * The `embedding` field is excluded server-side; only metadata is returned.
 */
export async function listMyEmbeddings(): Promise<FaceEmbeddingInfo[]> {
  return apiClient.get<FaceEmbeddingInfo[]>('/face/embeddings/');
}

/**
 * Soft-delete one of the authenticated user's face embeddings.
 * The record is marked `is_active = false` on the backend; the embedding
 * vector is not permanently removed from the database until an admin purges it.
 */
export async function deleteEmbedding(embeddingId: string): Promise<{ success: boolean; message: string }> {
  return apiClient.delete<{ success: boolean; message: string }>(
    `/face/embeddings/${embeddingId}/`,
  );
}

// ── Recognition ───────────────────────────────────────────────────────

/**
 * Identify a person from an image and — if recognised — record attendance.
 *
 * Employee path  (called from /employee/recognition):
 *   1:1 verification — the backend checks the image against the
 *   authenticated user's own enrolled embeddings only.
 *
 * Admin path  (called from /admin/recognition via `recognize_face`):
 *   Use `identifyFace()` below instead, which calls `/face/identify/`
 *   and does NOT automatically mark attendance.
 *
 * The response NEVER contains embedding vectors.
 */
export async function recognizeFace(params: {
  image_data: string;
  action?: RecognitionAction;
}): Promise<RecognitionResult> {
  return apiClient.post<RecognitionResult>('/face/recognize/', {
    image_data: params.image_data,
    action:     params.action ?? 'CHECK_IN',
  });
}

// ── Admin-only identification (1:N, no auto attendance) ───────────────

// Types are canonical in types/index.ts — re-exported here for consumers
// that import directly from services/face.
export type { IdentifyFaceRequest, IdentifyCandidate, IdentifyFaceResponse };

/**
 * Admin-only 1:N face identification.
 *
 * Searches the supplied image against ALL enrolled employees.
 * Does NOT mark attendance — the admin chooses whether to record it
 * via a subsequent call to `POST /api/attendance/admin/mark/`.
 *
 * Raw embeddings are never returned.
 */
export async function identifyFace(
  params: IdentifyFaceRequest,
): Promise<IdentifyFaceResponse> {
  return apiClient.post<IdentifyFaceResponse>('/face/identify/', {
    image_data: params.image_data,
    top_k:      params.top_k ?? 5,
  });
}

// ── Image helpers ─────────────────────────────────────────────────────

/** Maximum image dimension sent to the backend (pixels). */
const MAX_DIM = 640;
/** JPEG quality for compressed uploads (0–1). */
const JPEG_QUALITY = 0.85;

/**
 * Compress a base64 data-URL to a reasonable size before uploading.
 *
 * Resizes so neither dimension exceeds MAX_DIM, then re-encodes as JPEG.
 * This keeps payloads small without sacrificing recognition accuracy.
 *
 * Returns a new base64 data-URL.
 */
export function compressImageForUpload(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const scale = MAX_DIM / Math.max(width, height);
        width  = Math.round(width  * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not available')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = dataUrl;
  });
}

/**
 * Validate that a base64 data-URL is a supported image format.
 * Returns an error string, or null if valid.
 */
export function validateImageDataUrl(dataUrl: string): string | null {
  if (!dataUrl) return 'No image provided.';
  if (!dataUrl.startsWith('data:image/')) return 'Not a valid image data URL.';
  const [header] = dataUrl.split(',');
  const supported = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supported.some(t => header.includes(t))) {
    return 'Unsupported image format. Please use JPEG, PNG, or WebP.';
  }
  // Rough size check: base64 expands ~33 %, so len * 0.75 ≈ bytes
  const approxBytes = dataUrl.length * 0.75;
  if (approxBytes > 10 * 1024 * 1024) {
    return 'Image is too large (max 10 MB). Please use a smaller photo.';
  }
  return null;
}
