# Security Documentation — Face Recognition Attendance System

Phase 20 — Security Review

---

## Authentication & Authorisation

### JWT (JSON Web Tokens)
- All protected endpoints require a valid Bearer token in the `Authorization` header.
- Access tokens expire after **60 minutes** (configurable via `JWT_ACCESS_TOKEN_LIFETIME_MINUTES`).
- Refresh tokens expire after **7 days** (configurable via `JWT_REFRESH_TOKEN_LIFETIME_DAYS`).
- `ROTATE_REFRESH_TOKENS = False` — tokens are not silently rotated; clients must explicitly request a new access token.
- `BLACKLIST_AFTER_ROTATION = True` — used tokens land in the `rest_framework_simplejwt.token_blacklist` table and cannot be reused.
- `POST /api/auth/logout/` blacklists the submitted refresh token immediately.
- Token signing algorithm: **HS256** with a project-specific `SECRET_KEY`.

### Role-Based Access Control (RBAC)
Two roles exist: `ADMIN` and `EMPLOYEE`.

| Resource | EMPLOYEE | ADMIN |
|---|---|---|
| Own profile | Read + Write | Read + Write |
| Other profiles | No | Read + Write |
| Company-wide attendance | No | Read |
| Admin dashboard | No | Read |
| Employee management | No | Full CRUD |
| Face enrollment (own) | Yes | Yes |
| Face identification (all users) | No | Yes |
| Attendance export (all) | No | Yes |

Backend permissions are enforced independently of frontend route guards — every API view checks `request.user.role` explicitly.

Custom permission classes (`IsAdmin`, `IsOwnerOrAdmin`) live in `apps/accounts/permissions.py`.

---

## Rate Limiting (Throttling)

All endpoints are throttled via DRF's built-in throttling framework.

| Throttle scope | Rate | Applied to |
|---|---|---|
| `anon` | 30/minute | Unauthenticated requests |
| `user` | 300/minute | All authenticated requests |
| `auth` | 10/minute | `POST /api/auth/login/` and `/register/` |
| `face` | 20/minute | `POST /api/face/register/` and `/recognize/` |

Tight limits on auth endpoints reduce brute-force login risk.
Face endpoint limits prevent embedding enumeration attacks.

---

## Biometric Data Security

Face embeddings are 512-dimensional numerical vectors. They are **not face images** — the original photograph is never persisted.

### What is stored
- The 512-d embedding vector (in MongoDB, field `embedding` of `FaceEmbedding`).
- Quality score and detection metadata (confidence, age estimate, gender).
- Registration timestamp and source.

### What is NOT stored
- Original face images.
- Intermediate crops or aligned face patches.

### API exposure rules
- Raw embedding vectors are **never returned** in any API response.
- `FaceEmbeddingSerializer` explicitly excludes the `embedding` field from serialisation.
- Recognition results contain only: `recognized`, `employee_id`, `employee_name`, `confidence` (a scalar float).
- The frontend receives zero biometric data — it captures images and receives decisions.

### Storage access
- MongoDB collections are access-controlled at the database level.
- Only the Django backend service account has read/write access to the `face_embeddings` collection.
- Admins can manage embeddings via the Django admin interface (requires staff login).

### Deletion
- Employees can delete their own embeddings via `DELETE /api/face/embeddings/{id}/`.
- Deletion is a soft-delete (`is_active = False`) to preserve audit history.
- Full hard-delete can be performed by an admin via the Django admin interface.

---

## Transport Security

In production (`DEBUG=False`), the following headers and redirects are enforced:

```python
SECURE_HSTS_SECONDS = 31536000          # enforce HTTPS for 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True              # redirect HTTP → HTTPS
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'               # prevent clickjacking
```

---

## CORS

Allowed origins are configured via `CORS_ALLOWED_ORIGINS` (environment variable).
Only the React frontend origin (e.g., `http://localhost:3000`) is permitted.
`CORS_ALLOW_CREDENTIALS = True` enables cookie-based auth if needed.
Allowed methods: DELETE, GET, OPTIONS, PATCH, POST, PUT.
Allowed headers are explicitly enumerated — wildcard headers are not used.

---

## Input Validation

- All API inputs are validated through DRF serializers before reaching business logic.
- Image uploads are validated for:
  - Size (max 10 MB via `DATA_UPLOAD_MAX_MEMORY_SIZE`).
  - Format (must decode to a valid BGR image via OpenCV).
  - Minimum dimensions (112×112 pixels).
- Face validation rejects images with zero or more than one face.
- All query parameters are validated before database queries (prevents injection via ORM).

---

## Logging

What IS logged:
- Successful face enrollments (user ID, embedding ID, quality score).
- Successful and failed recognition attempts (user ID, similarity score, matched flag).
- Authentication failures (at WARNING level).
- Admin actions on biometric data.

What is NEVER logged:
- Passwords or password hashes.
- JWT secret keys or token values.
- Raw face embedding vectors.
- Full image data.
- Personal email addresses at DEBUG level in production.

---

## Data Retention & Consent

- This system is designed for legitimate employee attendance use only.
- Employees must provide consent before face registration.
- Embeddings are associated with the employee's user account and can be deleted on request.
- Operators must comply with applicable data protection regulations (GDPR, CCPA, PDPA, etc.) before deploying to production.
- Recommended retention policy: delete embeddings within 30 days of an employee leaving the organisation.

---

## Known Limitations & Mitigations

| Risk | Mitigation |
|---|---|
| Brute-force login | Auth throttle (10 req/min), account lockout can be added |
| Embedding enumeration | Face endpoint throttle (20 req/min per user) |
| Replay attack on images | Embeddings are compared at recognition time — no token is issued for an image alone |
| Insecure direct object reference | Ownership checks on every embedding/attendance operation |
| Mass assignment | DRF serializers with explicit `fields` or `read_only_fields` |
| Secret leakage | `SECRET_KEY` and `MONGODB_URI` are env-vars only; never committed |

---

*Last reviewed: Phase 20 completion — September 2026*
