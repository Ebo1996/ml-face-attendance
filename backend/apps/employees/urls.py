"""
Employee URLs
"""

from django.urls import path
from . import views

app_name = 'employees'

urlpatterns = [
    # Employee management (admin only)
    path('', views.EmployeeListView.as_view(), name='employee-list'),
    path('stats/', views.employee_stats, name='employee-stats'),
    path('<str:pk>/', views.EmployeeDetailView.as_view(), name='employee-detail'),
    path('<str:pk>/update/', views.EmployeeUpdateView.as_view(), name='employee-update'),
    path('<str:pk>/delete/', views.EmployeeDeleteView.as_view(), name='employee-delete'),
    
    # Profile management (any authenticated user)
    path('profile/update/', views.update_own_profile, name='profile-update'),
    path('profile/avatar/', views.upload_avatar, name='profile-avatar'),
]
