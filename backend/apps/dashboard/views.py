"""
Dashboard API Views

GET /api/dashboard/admin/    — company-wide stats for admin dashboard
GET /api/dashboard/employee/ — personal stats for employee dashboard
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    """
    Aggregated company-wide statistics for the admin dashboard.
    Requires ADMIN role.
    """
    if request.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=403)

    from apps.attendance.stats_service import (
        company_daily_stats, company_monthly_stats, company_recent_days
    )
    from apps.ml_service.models import FaceEmbedding
    from django.contrib.auth import get_user_model

    User = get_user_model()
    today = timezone.localdate()

    total_employees  = User.objects.filter(is_active=True).count()
    face_registered  = (
        FaceEmbedding.objects
        .filter(is_active=True)
        .values('user')
        .distinct()
        .count()
    )

    daily   = company_daily_stats(today)
    monthly = company_monthly_stats(today.year, today.month)
    recent  = company_recent_days(7)

    return Response({
        'total_employees':  total_employees,
        'face_registered':  face_registered,
        'today': {
            'present':         daily['present'],
            'late':            daily['late'],
            'half_day':        daily['half_day'],
            'absent':          daily['absent'],
            'on_leave':        daily['on_leave'],
            'checked_in':      daily['checked_in'],
            'attendance_rate': daily['attendance_rate'],
            'avg_work_hours':  daily['avg_work_hours'],
            'date':            daily['date'],
        },
        'this_month': {
            'year':            monthly['year'],
            'month':           monthly['month'],
            'total_records':   monthly['total_records'],
            'present':         monthly['present'],
            'late':            monthly['late'],
            'half_day':        monthly['half_day'],
            'on_leave':        monthly['on_leave'],
            'attendance_rate': monthly['attendance_rate'],
            'avg_work_hours':  monthly['avg_work_hours'],
        },
        'weekly_trend': recent,   # last 7 days for chart
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_dashboard(request):
    """
    Personal statistics for the employee dashboard.
    Any authenticated user can call this (data scoped to themselves).
    """
    from apps.attendance.stats_service import personal_summary, personal_weekly_stats
    from apps.attendance.service import get_attendance_service
    from apps.ml_service.models import FaceEmbedding

    today_status = get_attendance_service().get_today_status(request.user)
    summary      = personal_summary(request.user)
    weekly       = personal_weekly_stats(request.user)

    face_count = FaceEmbedding.objects.filter(
        user=request.user, is_active=True
    ).count()

    return Response({
        'today':            today_status,
        'summary':          summary,
        'weekly':           weekly,
        'face_registered':  face_count > 0,
        'face_count':       face_count,
    })
