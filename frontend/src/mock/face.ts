/**
 * mock/face.ts
 * ============
 * Mock face enrollment and recognition data.
 * Embedding vectors are NEVER present — mirrors the backend's API contract.
 */

import type {
  EnrollmentStats,
  FaceEmbeddingInfo,
  RecognitionResult,
  IdentifyFaceResponse,
} from '../types';

// ── Enrollment ────────────────────────────────────────────────────────

export const MOCK_ENROLLMENT_STATS: EnrollmentStats = {
  total_embeddings:  2,
  active_embeddings: 2,
  has_primary:       true,
  verified_count:    1,
  average_quality:   0.88,
  best_quality:      0.92,
  worst_quality:     0.84,
};

export const MOCK_EMBEDDINGS: FaceEmbeddingInfo[] = [
  {
    id:                   'emb-001',
    user_email:           'sarah.johnson@acme.com',
    user_name:            'Sarah Johnson',
    quality_score:        0.92,
    detection_confidence: 0.97,
    estimated_age:        29,
    gender:               'female',
    is_primary:           true,
    registration_source:  'WEBCAM_CAPTURE',
    notes:                '',
    is_active:            true,
    verified_by_admin:    true,
    embedding_dimension:  512,
    created_at:           '2024-01-10T09:00:00Z',
    updated_at:           '2024-01-10T09:00:00Z',
  },
  {
    id:                   'emb-002',
    user_email:           'sarah.johnson@acme.com',
    user_name:            'Sarah Johnson',
    quality_score:        0.84,
    detection_confidence: 0.94,
    estimated_age:        29,
    gender:               'female',
    is_primary:           false,
    registration_source:  'WEBCAM_CAPTURE',
    notes:                'Side-angle backup',
    is_active:            true,
    verified_by_admin:    false,
    embedding_dimension:  512,
    created_at:           '2024-02-05T14:30:00Z',
    updated_at:           '2024-02-05T14:30:00Z',
  },
];

// ── Recognition ───────────────────────────────────────────────────────

export const MOCK_RECOGNITION_SUCCESS: RecognitionResult = {
  recognized:        true,
  employee_id:       'emp-001',
  employee_name:     'Sarah Johnson',
  employee_email:    'sarah.johnson@acme.com',
  confidence:        0.91,
  confidence_level:  'VERY_HIGH',
  action:            'CHECK_IN',
  attendance: {
    id:     'att-new-001',
    date:   new Date().toISOString().split('T')[0],
    status: 'PRESENT',
  },
  message:           'Attendance recorded — checked in at 08:55',
  error:             null,
  processing_time_ms: 142,
};

export const MOCK_RECOGNITION_FAILURE: RecognitionResult = {
  recognized:       false,
  employee_id:      null,
  employee_name:    null,
  employee_email:   null,
  confidence:       0.38,
  confidence_level: 'VERY_LOW',
  action:           null,
  attendance:       null,
  message:          'Face not recognised. Please try again with a clearer photo.',
  error:            null,
  processing_time_ms: 118,
};

// ── Admin 1:N identification ──────────────────────────────────────────

export const MOCK_IDENTIFY_RESPONSE: IdentifyFaceResponse = {
  success:     true,
  identified:  true,
  top_match: {
    user_id:          'emp-001',
    similarity:       0.91,
    confidence_level: 'VERY_HIGH',
  },
  candidates: [
    { user_id: 'emp-001', similarity: 0.91, confidence_level: 'VERY_HIGH' },
    { user_id: 'emp-002', similarity: 0.61, confidence_level: 'LOW' },
  ],
  processing_time_ms: 156,
};
