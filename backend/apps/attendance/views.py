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


# =========================================================
# Phase 19 – Reports / CSV export
# =========================================================

import csv
from django.http import HttpResponse


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_my_attendance_csv(request):
    """
    Employee exports their own attendance as CSV.
    GET /api/attendance/export/my/?start_date=...&end_date=...
    """
    qs = AttendanceHistoryQuerySerializer(data=request.query_params)
    if not qs.is_valid():
        return Response({'error': qs.errors}, status=status.HTTP_400_BAD_REQUEST)

    svc = get_attendance_service()
    records = svc.get_user_history(
        request.user,
        start_date=qs.validated_data.get('start_date'),
        end_date=qs.validated_data.get('end_date'),
        limit=qs.validated_data.get('limit', 1000),
    )

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="my_attendance.csv"'

    writer = csv.writer(response)
    writer.writerow(['Date', 'Status', 'Check In', 'Check Out', 'Work Hours', 'Method', 'Notes'])
    for r in records:
        writer.writerow([
            r.date,
            r.status,
            r.check_in_time.strftime('%H:%M') if r.check_in_time else '',
            r.check_out_time.strftime('%H:%M') if r.check_out_time else '',
            r.work_hours or '',
            r.check_in_method,
            r.notes,
        ])
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_export_csv(request):
    """
    Admin exports all (or filtered) attendance as CSV.
    GET /api/attendance/export/admin/?start_date=...&end_date=...&status=...&user_id=...
    """
    if request.user.role != 'ADMIN':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    from .serializers import AdminListQuerySerializer
    from .models import AttendanceRecord

    qs = AdminListQuerySerializer(data=request.query_params)
    if not qs.is_valid():
        return Response({'error': qs.errors}, status=status.HTTP_400_BAD_REQUEST)

    d = qs.validated_data
    queryset = AttendanceRecord.objects.select_related('user').order_by('-date', '-check_in_time')
    if d.get('start_date'):
        queryset = queryset.filter(date__gte=d['start_date'])
    if d.get('end_date'):
        queryset = queryset.filter(date__lte=d['end_date'])
    if d.get('status'):
        queryset = queryset.filter(status=d['status'])
    if d.get('user_id'):
        queryset = queryset.filter(user_id=d['user_id'])

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="attendance_report.csv"'

    writer = csv.writer(response)
    writer.writerow(['Date', 'Employee', 'Email', 'Status', 'Check In', 'Check Out',
                     'Work Hours', 'Method', 'Admin Override', 'Notes'])
    for r in queryset[:5000]:  # cap at 5000 rows
        writer.writerow([
            r.date,
            f"{r.user.first_name} {r.user.last_name}".strip() or r.user.email,
            r.user.email,
            r.status,
            r.check_in_time.strftime('%H:%M') if r.check_in_time else '',
            r.check_out_time.strftime('%H:%M') if r.check_out_time else '',
            r.work_hours or '',
            r.check_in_method,
            'Yes' if r.admin_override else 'No',
            r.notes,
        ])
    return response


# =========================================================
# Spec canonical endpoints (Gap 2)
#   GET /api/attendance/        — list records (scoped by role)
#   GET /api/attendance/{id}/   — single record detail
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_list_api(request):
    """
    GET /api/attendance/

    Returns attendance records scoped by role:
      EMPLOYEE — own records only (last 30 by default)
      ADMIN    — all records, with optional filters

    Query params:
      start_date, end_date  YYYY-MM-DD
      status                PRESENT | LATE | HALF_DAY | ABSENT | ON_LEAVE
      user_id               (admin only) filter by employee
      page, page_size       pagination (admin only)
    """
    from .models import AttendanceRecord
    from .serializers import AdminListQuerySerializer

    if request.user.role == 'ADMIN':
        qs_ser = AdminListQuerySerializer(data=request.query_params)
        if not qs_ser.is_valid():
            return Response({'error': qs_ser.errors}, status=status.HTTP_400_BAD_REQUEST)

        d = qs_ser.validated_data
        from .stats_service import admin_attendance_list
        result = admin_attendance_list(
            start_date=d.get('start_date'),
            end_date=d.get('end_date'),
            status_filter=d.get('status') or None,
            user_id=d.get('user_id') or None,
            page=d.get('page', 1),
            page_size=d.get('page_size', 20),
        )
        serializer = AttendanceRecordSerializer(result['records'], many=True)
        return Response({
            'total':       result['total'],
            'page':        result['page'],
            'page_size':   result['page_size'],
            'total_pages': result['total_pages'],
            'results':     serializer.data,
        })

    # EMPLOYEE — own records only
    qs_ser = AttendanceHistoryQuerySerializer(data=request.query_params)
    if not qs_ser.is_valid():
        return Response({'error': qs_ser.errors}, status=status.HTTP_400_BAD_REQUEST)

    svc = get_attendance_service()
    records = svc.get_user_history(
        request.user,
        start_date=qs_ser.validated_data.get('start_date'),
        end_date=qs_ser.validated_data.get('end_date'),
        limit=qs_ser.validated_data.get('limit', 30),
    )
    serializer = AttendanceRecordSerializer(records, many=True)
    return Response({'results': serializer.data, 'total': len(serializer.data)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_detail_api(request, record_id):
    """
    GET /api/attendance/{id}/

    Returns a single attendance record.
      EMPLOYEE — may only access own records.
      ADMIN    — may access any record.
    """
    from .models import AttendanceRecord

    try:
        record = AttendanceRecord.objects.select_related('user').get(pk=record_id)
    except AttendanceRecord.DoesNotExist:
        return Response({'error': 'Attendance record not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Ownership check for employees
    if request.user.role != 'ADMIN' and record.user_id != request.user.pk:
        return Response({'error': 'Not authorised to view this record.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = AttendanceRecordSerializer(record)
    return Response(serializer.data)
