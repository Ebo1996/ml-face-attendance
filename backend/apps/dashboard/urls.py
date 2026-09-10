from django.urls import path
from . import views
from . import health_views

app_name = 'dashboard'

urlpatterns = [
    path('admin/',    views.admin_dashboard,    name='admin-dashboard'),
    path('employee/', views.employee_dashboard, name='employee-dashboard'),
    
    # Health check endpoints (no auth required)
    path('health/',     health_views.health_check,     name='health'),
    path('ready/',      health_views.readiness_check,  name='readiness'),
    path('live/',       health_views.liveness_check,   name='liveness'),
]
