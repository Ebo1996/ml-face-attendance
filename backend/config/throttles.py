"""
config/throttles.py
===================
Custom throttle classes for security-sensitive endpoints.

Phase 20 — Security
"""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """
    Strict rate limit for authentication endpoints (login, register).
    Applies to anonymous requests (pre-authentication).
    """
    scope = 'auth'


class FaceRateThrottle(UserRateThrottle):
    """
    Rate limit for face recognition / enrollment endpoints.
    Applies per authenticated user.
    """
    scope = 'face'
