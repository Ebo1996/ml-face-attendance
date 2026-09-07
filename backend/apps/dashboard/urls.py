from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    path('admin/',    views.admin_dashboard,    name='admin-dashboard'),
    path('employee/', views.employee_dashboard, name='employee-dashboard'),
]
