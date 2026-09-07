# ML Architecture — Face Recognition Attendance System

## Important Statement

This system uses a **pretrained InsightFace buffalo_l model**. The face recognition neural network was **not trained by this project**. The system:

- Loads pretrained weights from InsightFace (buffalo_l model pack)
- Detects faces using the included SCRFD detector
- Generates 512-dimensional numerical embeddings from those detections
- Enrolls employees by storing their embeddings
- Compares new embeddings against enrolled ones using cosine similarity
- Records attendance when similarity exceeds a configurable threshold

This is the correct and accurate description. Do **not** claim that ArcFace or SCRFD were trained from scratch.

---

## Model Overview

| Component | Model | Source | Purpose |
|---|---|---|---|
| Face Detection | SCRFD (det_10g.onnx) | InsightFace buffalo_l | Detect faces, bounding boxes, 5 keypoints |
| Face Recognition | ResNet-50 ArcFace (w600k_r50.onnx) | InsightFace buffalo_l | Generate 512-d face embeddings |
| Gender + Age | genderage.onnx | InsightFace buffalo_l | Optional metadata |
| 3D Landmarks | 1k3d68.onnx | InsightFace buffalo_l | Optional alignment |
| 2D Landmarks | 2d106det.onnx | InsightFace buffalo_l | Optional alignment |

The buffalo_l pack is loaded via:
```python
from insightface.app import FaceAnalysis
app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0, det_size=(640, 640))
```

Models are downloaded automatically on first use to `~/.insightface/models/buffalo_l/`.

---

## Full Recognition Pipeline

```
Input Image (from browser/camera, base64-encoded)
       │
       ▼
┌─────────────────────────────┐
│  Image Decode & Validate    │  cv2.imdecode → BGR numpy array
│  (ml/embedding_service.py)  │  min 112×112, max 10 MB
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  SCRFD Face Detection       │  det_10g.onnx
│  (apps/ml_service/          │  Input: 640×640
│   face_detector.py)         │  Output: bbox[4], kps[5], det_score
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  Quality & Count Validation │  det_score ≥ 0.85
│                             │  Exactly 1 face required
│                             │  quality_score ≥ 0.50
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  Face Alignment             │  5-point keypoint affine transform
│                             │  Output: 112×112 aligned crop
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  ArcFace Embedding          │  w600k_r50.onnx (ResNet-50)
│  (buffalo_l recognition)    │  Input: 1×3×112×112
│                             │  Output: 512-d float vector (L2-norm)
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  Cosine Similarity          │  sklearn cosine_similarity
│  (ml/face_recognizer.py)    │  Normalised to [0,1]: (cos+1)/2
│                             │  Compare against enrolled embeddings
└────────────┬────────────────┘
             │
       ┌─────┴──────┐
       │            │
       ▼            ▼
  Enrollment     Recognition
  (store emb)    (compare + decide)
                      │
                      ▼
              Threshold check
              VERIFICATION  ≥ 0.60
              IDENTIFICATION ≥ 0.55
                      │
                      ▼
              Attendance decision
              → Django REST API
              → MongoDB Atlas
```

---

## Enrollment Pipeline

```
Employee → Camera → Capture → base64 upload
  ↓
POST /api/face/register/
  ↓
apps/recognition/views.register_face()
  ↓
apps/ml_service/enrollment_service.validate_face_image()
  - Decode image
  - SCRFD detection (must find exactly 1 face)
  - det_score ≥ 0.85
  - quality_score ≥ 0.50
  ↓
enrollment_service.enroll_face()
  - ArcFace embedding (512-d)
  - Duplicate check: similarity < 0.80 required
  - Store FaceEmbedding in MongoDB
  - Never store original image
```

---

## Recognition Pipeline

```
Camera → Capture → base64 upload
  ↓
POST /api/face/recognize/
  ↓
apps/recognition/views.recognize_face()
  ↓
apps/ml_service/matching_service:

EMPLOYEE path (1:1 verification):
  verify(image_data, request.user)
    → extract embedding
    → load user's enrolled embeddings from DB (cached)
    → best cosine similarity ≥ VERIFICATION_THRESHOLD (0.60)?
    → is_match = True/False

ADMIN path (1:N identification):
  identify(image_data, top_k=1)
    → extract embedding
    → load ALL enrolled user embeddings (cached, best per user)
    → rank by cosine similarity
    → top match ≥ IDENTIFICATION_THRESHOLD (0.55)?
    → returns user_id + similarity

  ↓
Attendance service:
  check_in_without_face(recognized_user)  or
  check_out_without_face(recognized_user)
  ↓
MongoDB: AttendanceRecord saved
  ↓
Response: { recognized, employee_id, employee_name, confidence }
  (NO embedding returned to frontend)
```

---

## ONNX Model Specifications

| File | Purpose | Input Shape | Output |
|---|---|---|---|
| det_10g.onnx | SCRFD face detection | 1×3×H×W (640×640) | bbox, kps, score |
| w600k_r50.onnx | ArcFace recognition (ResNet-50) | 1×3×112×112 | 512-d float32 vector |
| genderage.onnx | Gender + age prediction | 1×3×96×96 | [gender(int), age(int)] |
| 1k3d68.onnx | 3D facial landmarks | 1×3×192×192 | 68×3 keypoints |
| 2d106det.onnx | 2D facial landmarks | 1×3×192×192 | 106×2 keypoints |

---

## Thresholds (Configurable)

| Parameter | Default | Env Variable | Description |
|---|---|---|---|
| Detection confidence | 0.85 | — | Min SCRFD score to accept a detected face |
| Enrollment quality | 0.50 | — | Min quality score to enroll a face |
| Duplicate detection | 0.80 | — | Reject enrollment if similarity > this |
| Verification threshold | **0.60** | `FACE_VERIFICATION_THRESHOLD` | 1:1 match threshold |
| Identification threshold | **0.55** | `FACE_IDENTIFICATION_THRESHOLD` | 1:N match threshold |

Confidence level labels:

| Label | Similarity Range |
|---|---|
| VERY_HIGH | ≥ 0.90 |
| HIGH | ≥ 0.80 |
| MEDIUM | ≥ 0.70 |
| LOW | ≥ 0.60 |
| VERY_LOW | < 0.60 |

---

## Embedding Cache

`apps/ml_service/matching_service.EmbeddingCache`:
- Thread-safe (`threading.RLock`)
- Per-user entries + all-users aggregate entry
- TTL: 300 seconds (5 minutes)
- Auto-invalidated on enrollment changes
- Avoids repeated DB reads during burst recognition

---

## Biometric Data Handling

| Data | Stored | Returned via API |
|---|---|---|
| Original face image | ❌ Never | ❌ Never |
| 512-d embedding vector | ✅ MongoDB | ❌ Never |
| Quality score | ✅ Metadata | ✅ (enrollment response only) |
| Detection confidence | ✅ Metadata | ✅ (enrollment response only) |
| Similarity score | ❌ | ✅ (recognition response — scalar only) |
| Identity decision | ❌ | ✅ (recognized: bool) |

---

## Performance (CPU, Python 3.13)

| Operation | Approximate Time |
|---|---|
| Image decode + validation | 5–15 ms |
| SCRFD face detection | 50–100 ms |
| ArcFace embedding extraction | 20–50 ms |
| Cosine similarity (100 users) | 1–5 ms |
| **End-to-end (recognition)** | **~100–200 ms** |

GPU inference (CUDAExecutionProvider) reduces inference to ~15–30 ms.

Switch providers in `face_detector.py`:
```python
self.app = FaceAnalysis(
    name='buffalo_l',
    providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
)
```

---

## Training Data (Pretrained Models)

The buffalo_l models are trained by the InsightFace team, not by this project:

| Model | Training Dataset |
|---|---|
| SCRFD detection | WIDER FACE |
| ArcFace recognition | MS1MV3 (5.8M images, 93K identities) |
| LFW benchmark accuracy | ~99.8% (reported by InsightFace) |

---

## Code Structure

```
backend/
├── ml/                         # Top-level ML facade (thin wrappers)
│   ├── face_detector.py        # Re-exports from apps/ml_service/face_detector
│   ├── face_recognizer.py      # Re-exports from apps/ml_service/face_recognizer
│   ├── embedding_service.py    # Full image→embedding pipeline
│   ├── matching_service.py     # Verification + identification functions
│   └── evaluation/
│       ├── evaluate.py         # Phase 21 evaluation script
│       ├── EVALUATION_REPORT.md
│       └── evaluation_report.json
│
└── apps/ml_service/            # Django app (models, views, services)
    ├── face_detector.py        # FaceDetector class (InsightFace wrapper)
    ├── face_recognizer.py      # FaceRecognizer class (cosine similarity)
    ├── enrollment_service.py   # Face enrollment + quality validation
    ├── matching_service.py     # FaceMatchingService (cache, verify, identify)
    ├── models.py               # FaceEmbedding, FaceRegistrationSession
    └── views.py                # Enrollment + matching API views
```

---

## Evaluation Results (Phase 21)

Evaluated on synthetic test pairs (200 genuine, 400 impostor, 50 identities):

| Metric | Value |
|---|---|
| TAR (True Accept Rate) | 83.50% |
| FAR (False Accept Rate) | 0.00% |
| EER (Equal Error Rate) | 0.38% at threshold 0.56 |
| AUC | 1.00 |
| F1 Score | 0.91 |
| Avg end-to-end latency | ~8 ms (cosine only; add ~100ms for InsightFace on CPU) |

See `ml/evaluation/EVALUATION_REPORT.md` for full details.

---

*Last updated: Phase 22 — ML Model Documentation*
