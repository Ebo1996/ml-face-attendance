"""
Health check endpoints for monitoring and CI/CD
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
import sys


@csrf_exempt
@require_http_methods(["GET", "HEAD"])
def health_check(request):
    """
    Basic health check endpoint
    Returns 200 if service is running
    """
    return JsonResponse({
        'status': 'healthy',
        'service': 'face-attendance-backend',
        'python_version': f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    })


@csrf_exempt
@require_http_methods(["GET"])
def readiness_check(request):
    """
    Readiness check - verifies database connectivity
    Returns 200 if service is ready to accept traffic
    """
    try:
        # Check database connection
        connection.ensure_connection()
        
        return JsonResponse({
            'status': 'ready',
            'database': 'connected',
            'service': 'face-attendance-backend'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'not_ready',
            'database': 'disconnected',
            'error': str(e)
        }, status=503)


@csrf_exempt
@require_http_methods(["GET"])
def liveness_check(request):
    """
    Liveness check - verifies service is alive
    Returns 200 if process is running
    """
    return JsonResponse({
        'status': 'alive',
        'service': 'face-attendance-backend'
    })
