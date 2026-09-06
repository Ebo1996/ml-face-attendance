"""
Attendance API Views
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

from .service import get_attendance_service
from .serializers import (
    AttendanceRecordSerializer,
    FaceCheckInSerializer,
    TodayStatusResponseSerializer,
    AdminMarkAttendanceSerializer,
    AttendanceHistoryQuerySerializer,
)

import logging

logger = logging.getLogger(__name__)
User = get_user_model()


# ── Employee endpoints ────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_in_api(request):
    """
    Employee checks in with face recognition.

    POST /api/attendance/check-in/
    Body: { "image_data": "data:image/jpeg;base64,..." }
    """
    serializer = FaceCheckInSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    svc = get_attendance_service()
    result = svc.check_in(request.user, serializer.validated_data['image_data'])

    http_status = status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST
    return Response(result, status=http_status)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_out_api(request):
    """
    Employee checks out with face recognition.

    POST /api/attendance/check-out/
    Body: { "image_data": "data:image/jpeg;base64,..." }
    """
    serializer = FaceCheckInSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    svc = get_attendance_service()
    result = svc.check_out(request.user, serializer.validated_data['image_data'])

    http_status = status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST
    return Response(result, status=http_status)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def today_status_api(request):
    """
    Get today's attendance status for the authenticated user.

    GET /api/attendance/today/
    """
    svc = get_attendance_service()
    result = svc.get_today_status(request.user)
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_history_api(request):
    """
    Get attendance history for the authenticated user.

    GET /api/attendance/my-history/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&limit=30
    """
    query_serializer = AttendanceHistoryQuerySerializer(data=request.query_params)
    if not query_serializer.is_valid():
        return Response({'error': query_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    svc = get_attendance_service()
    records = svc.get_user_history(
        request.user,
        start_date=query_serializer.validated_data.get('start_date'),
        end_date=query_serializer.validated_data.get('end_date'),
        limit=query_serializer.validated_data.get('limit', 30),
    )

    serializer = AttendanceRecordSerializer(records, many=True)
    return Response(serializer.data)


# ── Admin endpoints ───────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_mark_attendance_api(request):
    """
    Admin manually marks attendance for an employee.

    POST /api/attendance/admin/mark/
    Body: { user_id, date, status, check_in_time?, check_out_time?, notes? }
    """
    if request.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    serializer = AdminMarkAttendanceSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    try:
        target = User.objects.get(pk=data['user_id'], is_active=True)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    svc = get_attendance_service()
    success, record_data, err = svc.admin_mark_attendance(
        user=target,
        attendance_date=data['date'],
        status=data['status'],
        check_in_time=data.get('check_in_time'),
        check_out_time=data.get('check_out_time'),
        notes=data.get('notes', ''),
    )

    if success:
        return Response({'success': True, 'attendance': record_data})
    return Response({'success': False, 'error': err}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_employee_attendance_api(request, user_id):
    """
    Admin views attendance history for a specific employee.

    GET /api/attendance/admin/employee/<user_id>/?start_date=...&end_date=...&limit=30
    """
    if request.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    try:
        target = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    query_serializer = AttendanceHistoryQuerySerializer(data=request.query_params)
    if not query_serializer.is_valid():
        return Response({'error': query_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    svc = get_attendance_service()
    records = svc.get_user_history(
        target,
        start_date=query_serializer.validated_data.get('start_date'),
        end_date=query_serializer.validated_data.get('end_date'),
        limit=query_serializer.validated_data.get('limit', 30),
    )

    serializer = AttendanceRecordSerializer(records, many=True)
    return Response({
        'user_id': user_id,
        'email': target.email,
        'records': serializer.data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_today_overview_api(request):
    """
    Admin: get all attendance records for today.

    GET /api/attendance/admin/today/
    """
    if request.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    from django.utils import timezone
    from .models import AttendanceRecord

    today = timezone.localdate()
    records = AttendanceRecord.objects.filter(date=today).select_related('user').order_by('check_in_time')

    serializer = AttendanceRecordSerializer(records, many=True)

    # Summary counts
    total = records.count()
    present = records.filter(status__in=['PRESENT', 'LATE']).count()
    late = records.filter(status='LATE').count()
    half_day = records.filter(status='HALF_DAY').count()

    return Response({
        'date': str(today),
        'summary': {
            'total_checked_in': total,
            'present': present,
            'late': late,
            'half_day': half_day,
        },
        'records': serializer.data,
    })


# =========================================================
# Phase 13 – Statistics & reporting views
# =========================================================

from django.utils import timezone as tz
from .stats_service import (
    personal_monthly_stats,
    personal_weekly_stats,
    personal_summary,
    company_daily_stats,
    company_monthly_stats,
    company_recent_days,
    admin_attendance_list,
)
from .serializers import (
    PersonalStatsQuerySerializer,
    WeeklyStatsQuerySerializer,
    AdminListQuerySerializer,
    CompanyMonthlyQuerySerializer,
    RecentDaysQuerySerializer,
)


# ── Employee stats ────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_monthly_stats_api(request):
    """
    Monthly attendance stats for the authenticated employee.

    GET /api/attendance/my-stats/monthly/?year=2026&month=9
    """
    today = tz.localdate()
    qs = PersonalStatsQuerySerializer(data=request.query_params)
    if not qs.is_valid():
        return Response({'error': qs.errors}, status=status.HTTP_400_BAD_REQUEST)

    year  = qs.validated_data.get('year', today.year)
    month = qs.validated_data.get('month', today.month)

    data = personal_monthly_stats(request.user, year, month)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_weekly_stats_api(request):
    """
    Weekly attendance stats for the authenticated employee.

    GET /api/attendance/my-stats/weekly/?ref_date=2026-09-06
    """
    qs = WeeklyStatsQuerySerializer(data=request.query_params)
    if not qs.is_valid():
        return Response({'error': qs.errors}, status=status.HTTP_400_BAD_REQUEST)

    data = personal_weekly_stats(request.user, qs.validated_data.get('ref_date'))
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_summary_api(request):
    """
    Dashboard summary card data for the authenticated employee.

    GET /api/attendance/my-stats/summary/
    """
    return Response(personal_summary(request.user))


# ── Admin stats ───────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_daily_stats_api(request):
    """
    Company-wide stats for a single date.

    GET /api/attendance/admin/stats/daily/?date=2026-09-06
    """
    if request.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    from rest_framework import serializers as drf_serializers

    class DateQ(drf_serializers.Serializer):
        date = drf_serializers.DateField(required=False)

    qs = DateQ(data=request.query_params)
    if not qs.is_valid():
        return Response({'error': qs.errors}, status=status.HTTP_400_BAD_REQUEST)

    return Response(company_daily_stats(qs.validated_data.get('date')))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_monthly_stats_api(request):
    """
    Company-wide stats for a calendar month.

    GET /api/attendance/admin/stats/monthly/?year=2026&month=9
    """
    if request.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    today = tz.localdate()
    qs = CompanyMonthlyQuerySerializer(data=request.query_params)
    if not qs.is_valid():
        return Response({'error': qs.errors}, status=status.HTTP_400_BAD_REQUEST)

    year  = qs.validated_data.get('year', today.year)
    month = qs.validated_data.get('month', today.month)
    return Response(company_monthly_stats(year, month))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_recent_days_api(request):
    """
    Company attendance trend for the last N days (default 7).

    GET /api/attendance/admin/stats/recent/?days=14
    """
    if request.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    qs = RecentDaysQuerySerializer(data=request.query_params)
    if not qs.is_valid():
        return Response({'error': qs.errors}, status=status.HTTP_400_BAD_REQUEST)

    return Response(company_recent_days(qs.validated_data.get('days', 7)))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_api(request):
    """
    Paginated, filterable attendance list for admin.

    GET /api/attendance/admin/list/?start_date=...&end_date=...
                                   &status=LATE&user_id=...&page=1&page_size=20
    """
    if request.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    qs = AdminListQuerySerializer(data=request.query_params)
    if not qs.is_valid():
        return Response({'error': qs.errors}, status=status.HTTP_400_BAD_REQUEST)

    d = qs.validated_data
    result = admin_attendance_list(
        start_date    = d.get('start_date'),
        end_date      = d.get('end_date'),
        status_filter = d.get('status') or None,
        user_id       = d.get('user_id') or None,
        page          = d.get('page', 1),
        page_size     = d.get('page_size', 20),
    )

    records_serializer = AttendanceRecordSerializer(result['records'], many=True)
    return Response({
        'total':       result['total'],
        'page':        result['page'],
        'page_size':   result['page_size'],
        'total_pages': result['total_pages'],
        'records':     records_serializer.data,
    })
