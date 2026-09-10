"""
URL configuration for Face Attendance System project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.dashboard.health_views import health_check, readiness_check, liveness_check

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/employees/', include('apps.employees.urls')),
    path('api/', include('apps.ml_service.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/face/', include('apps.recognition.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),

    # Top-level health check endpoints (used by Docker, nginx, load balancers)
    path('api/health/',  health_check,      name='health'),
    path('api/ready/',   readiness_check,   name='readiness'),
    path('api/live/',    liveness_check,    name='liveness'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
