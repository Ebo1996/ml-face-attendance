"""
Face Matching Service

Provides 1:1 verification and 1:N identification against enrolled face embeddings.
Includes an in-memory embedding cache for performance.
"""

import numpy as np
import time
import threading
from typing import List, Optional, Tuple, Dict, Any
import logging

from .face_detector import get_face_detector
from .face_recognizer import get_face_recognizer
from .utils.image_utils import load_image_from_base64, validate_image

logger = logging.getLogger(__name__)


class EmbeddingCache:
    """
    Thread-safe in-memory cache for face embeddings.
    
    Avoids repeated database reads during high-frequency recognition.
    Cache is invalidated when embeddings are added/changed.
    """

    def __init__(self, ttl_seconds: int = 300):
        """
        Args:
            ttl_seconds: Cache time-to-live in seconds (default 5 minutes)
        """
        self._cache: Dict[str, Dict[str, Any]] = {}   # user_id -> {embedding, ts}
        self._all_cache: Optional[Dict[str, Any]] = None
        self._all_cache_ts: float = 0.0
        self._ttl = ttl_seconds
        self._lock = threading.RLock()

    def get_user_embeddings(self, user_id: str) -> Optional[List[np.ndarray]]:
        """Return cached embeddings for user, or None if stale/missing."""
        with self._lock:
            entry = self._cache.get(user_id)
            if entry and (time.time() - entry['ts']) < self._ttl:
                return entry['embeddings']
            return None

    def set_user_embeddings(self, user_id: str, embeddings: List[np.ndarray]):
        """Cache embeddings for a user."""
        with self._lock:
            self._cache[user_id] = {'embeddings': embeddings, 'ts': time.time()}

    def invalidate_user(self, user_id: str):
        """Remove cached embeddings for a user."""
        with self._lock:
            self._cache.pop(user_id, None)
            self._all_cache = None  # Invalidate global cache too

    def get_all_embeddings(self) -> Optional[Tuple[List[str], List[np.ndarray]]]:
        """Return cached (user_ids, embeddings) for all users, or None if stale."""
        with self._lock:
            if (
                self._all_cache is not None
                and (time.time() - self._all_cache_ts) < self._ttl
            ):
                return self._all_cache['user_ids'], self._all_cache['embeddings']
            return None

    def set_all_embeddings(self, user_ids: List[str], embeddings: List[np.ndarray]):
        """Cache the full set of (user_id, embedding) pairs."""
        with self._lock:
            self._all_cache = {'user_ids': user_ids, 'embeddings': embeddings}
            self._all_cache_ts = time.time()

    def clear(self):
        """Flush the entire cache."""
        with self._lock:
            self._cache.clear()
            self._all_cache = None
            self._all_cache_ts = 0.0


class FaceMatchingService:
    """
    Core face matching engine.

    Supports:
    - 1:1 Verification  — is this image the same person as a given user?
    - 1:N Identification — who is this person among all enrolled users?
    - Top-K candidates  — return ranked list of best matches
    """

    def __init__(
        self,
        verification_threshold: float = 0.60,
        identification_threshold: float = 0.55,
        cache_ttl: int = 300,
    ):
        self.detector = get_face_detector()
        self.recognizer = get_face_recognizer(verification_threshold)
        self.verification_threshold = verification_threshold
        self.identification_threshold = identification_threshold
        self.cache = EmbeddingCache(ttl_seconds=cache_ttl)
        logger.info(
            f"FaceMatchingService initialized — "
            f"verify_threshold={verification_threshold}, "
            f"identify_threshold={identification_threshold}"
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _extract_embedding(
        self, image_data: str
    ) -> Tuple[Optional[np.ndarray], Optional[str]]:
        """
        Decode a base64 image, detect exactly one face, and return its embedding.

        Returns:
            (embedding, None)         on success
            (None, error_message)     on failure
        """
        try:
            image = load_image_from_base64(image_data)
            is_valid, err = validate_image(image)
            if not is_valid:
                return None, err

            face = self.detector.detect_single_face(image)
            if face is None:
                faces = self.detector.detect_faces(image, max_faces=5)
                if len(faces) == 0:
                    return None, "No face detected in image"
                return None, f"Multiple faces detected ({len(faces)}). Show only one face."

            if face['det_score'] < 0.85:
                return None, (
                    f"Low detection confidence ({face['det_score']:.2f}). "
                    "Use a clearer, well-lit photo."
                )

            return np.array(face['embedding']), None

        except Exception as exc:
            logger.error(f"_extract_embedding error: {exc}")
            return None, f"Image processing error: {exc}"

    def _load_user_embeddings(self, user) -> List[np.ndarray]:
        """
        Return active embeddings for *user*, using cache when valid.
        Import is deferred to avoid circular model-registry issues.
        """
        from .models import FaceEmbedding  # lazy import

        cached = self.cache.get_user_embeddings(str(user.pk))
        if cached is not None:
            return cached

        objs = FaceEmbedding.get_active_embeddings_for_user(user)
        embeddings = [np.array(e.embedding) for e in objs]
        self.cache.set_user_embeddings(str(user.pk), embeddings)
        return embeddings

    def _load_all_embeddings(self) -> Tuple[List[str], List[np.ndarray]]:
        """
        Return (user_id_list, embedding_list) for ALL active enrolled users.
        Uses per-request cache.
        """
        from .models import FaceEmbedding  # lazy import
        from django.contrib.auth import get_user_model  # lazy import
        User = get_user_model()

        cached = self.cache.get_all_embeddings()
        if cached is not None:
            return cached

        user_ids: List[str] = []
        embeddings: List[np.ndarray] = []

        active = (
            FaceEmbedding.objects
            .filter(is_active=True)
            .select_related('user')
            .order_by('user_id', '-is_primary', '-quality_score')
        )

        # Keep only the best embedding per user for 1:N identification
        seen_users: Dict[str, bool] = {}
        for obj in active:
            uid = str(obj.user_id)
            if uid not in seen_users:
                user_ids.append(uid)
                embeddings.append(np.array(obj.embedding))
                seen_users[uid] = True

        self.cache.set_all_embeddings(user_ids, embeddings)
        logger.info(f"Loaded {len(user_ids)} enrolled users into cache")
        return user_ids, embeddings

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def verify(
        self, image_data: str, user
    ) -> Dict[str, Any]:
        """
        1:1 Verification — does *image_data* match *user*?

        Args:
            image_data: Base64-encoded query image
            user:       Django User object to verify against

        Returns dict with keys:
            success (bool), is_match (bool), similarity (float),
            confidence_level (str), message (str), error (str|None),
            processing_time_ms (float)
        """
        t0 = time.time()

        query_emb, err = self._extract_embedding(image_data)
        if query_emb is None:
            return {
                'success': False,
                'is_match': False,
                'similarity': 0.0,
                'confidence_level': 'NONE',
                'error': err,
                'processing_time_ms': (time.time() - t0) * 1000,
            }

        user_embeddings = self._load_user_embeddings(user)
        if not user_embeddings:
            return {
                'success': False,
                'is_match': False,
                'similarity': 0.0,
                'confidence_level': 'NONE',
                'error': 'No enrolled face found for this user. Please register first.',
                'processing_time_ms': (time.time() - t0) * 1000,
            }

        # Use the highest similarity across all of the user's embeddings
        best_sim = max(
            self.recognizer.compute_similarity(query_emb, emb)
            for emb in user_embeddings
        )

        is_match = best_sim >= self.verification_threshold
        confidence = _confidence_level(best_sim)

        logger.info(
            f"Verify user={user.pk}: similarity={best_sim:.4f}, "
            f"match={is_match}, confidence={confidence}"
        )
        return {
            'success': True,
            'is_match': is_match,
            'similarity': round(best_sim, 4),
            'confidence_level': confidence,
            'message': 'Identity verified' if is_match else 'Identity not verified',
            'error': None,
            'processing_time_ms': round((time.time() - t0) * 1000, 1),
        }

    def identify(
        self,
        image_data: str,
        top_k: int = 3,
    ) -> Dict[str, Any]:
        """
        1:N Identification — find who is in *image_data* among ALL enrolled users.

        Args:
            image_data: Base64-encoded query image
            top_k:      Maximum number of candidates to return

        Returns dict with keys:
            success (bool), identified (bool), top_match (dict|None),
            candidates (list[dict]), processing_time_ms (float),
            error (str|None)
        """
        t0 = time.time()

        query_emb, err = self._extract_embedding(image_data)
        if query_emb is None:
            return {
                'success': False,
                'identified': False,
                'top_match': None,
                'candidates': [],
                'error': err,
                'processing_time_ms': (time.time() - t0) * 1000,
            }

        user_ids, all_embeddings = self._load_all_embeddings()
        if not user_ids:
            return {
                'success': False,
                'identified': False,
                'top_match': None,
                'candidates': [],
                'error': 'No enrolled users found in the system.',
                'processing_time_ms': (time.time() - t0) * 1000,
            }

        # Rank all users by similarity
        scored = [
            (uid, self.recognizer.compute_similarity(query_emb, emb))
            for uid, emb in zip(user_ids, all_embeddings)
        ]
        scored.sort(key=lambda x: x[1], reverse=True)

        # Filter by threshold and cap at top_k
        candidates = [
            {'user_id': uid, 'similarity': round(sim, 4), 'confidence_level': _confidence_level(sim)}
            for uid, sim in scored[:top_k]
            if sim >= self.identification_threshold
        ]

        identified = bool(candidates)
        top_match = candidates[0] if identified else None

        if identified:
            logger.info(
                f"Identified user_id={top_match['user_id']} "
                f"(similarity={top_match['similarity']:.4f})"
            )
        else:
            logger.info("Identification: no match found above threshold")

        return {
            'success': True,
            'identified': identified,
            'top_match': top_match,
            'candidates': candidates,
            'error': None,
            'processing_time_ms': round((time.time() - t0) * 1000, 1),
        }

    def invalidate_cache(self, user_id: Optional[str] = None):
        """
        Invalidate cache entries.
        Pass user_id to invalidate only that user; omit to flush everything.
        """
        if user_id:
            self.cache.invalidate_user(user_id)
            logger.info(f"Cache invalidated for user_id={user_id}")
        else:
            self.cache.clear()
            logger.info("Entire embedding cache flushed")

    def get_cache_stats(self) -> Dict[str, Any]:
        """Return internal cache statistics."""
        with self.cache._lock:
            user_count = len(self.cache._cache)
            all_loaded = self.cache._all_cache is not None
        return {
            'cached_users': user_count,
            'all_users_cached': all_loaded,
            'cache_ttl_seconds': self.cache._ttl,
        }


# ------------------------------------------------------------------
# Confidence helper
# ------------------------------------------------------------------

def _confidence_level(similarity: float) -> str:
    """Map similarity score to a human-readable confidence label."""
    if similarity >= 0.90:
        return 'VERY_HIGH'
    elif similarity >= 0.80:
        return 'HIGH'
    elif similarity >= 0.70:
        return 'MEDIUM'
    elif similarity >= 0.60:
        return 'LOW'
    else:
        return 'VERY_LOW'


# ------------------------------------------------------------------
# Singleton
# ------------------------------------------------------------------

_matching_service: Optional[FaceMatchingService] = None


def get_matching_service() -> FaceMatchingService:
    """Return (and lazily create) the global FaceMatchingService singleton."""
    global _matching_service
    if _matching_service is None:
        _matching_service = FaceMatchingService()
    return _matching_service
