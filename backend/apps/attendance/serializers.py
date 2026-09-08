"""
Attendance Serializers
"""

from rest_framework import serializers


def _get_attendance_record_model():
    from .models import AttendanceRecord
    return AttendanceRecord


class AttendanceRecordSerializer(serializers.Serializer):
    """Full attendance record (read-only, dict-based for API responses)."""
    id = serializers.CharField(read_only=True)
    user_email = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    date = serializers.DateField(read_only=True)
    status = serializers.CharField(read_only=True)
    check_in_time = serializers.DateTimeField(read_only=True, allow_null=True)
    check_in_method = serializers.CharField(read_only=True)
    check_in_similarity = serializers.FloatField(read_only=True, allow_null=True)
    check_in_confidence = serializers.CharField(read_only=True, allow_blank=True)
    check_out_time = serializers.DateTimeField(read_only=True, allow_null=True)
    check_out_method = serializers.CharField(read_only=True)
    check_out_similarity = serializers.FloatField(read_only=True, allow_null=True)
    check_out_confidence = serializers.CharField(read_only=True, allow_blank=True)
    work_hours = serializers.FloatField(read_only=True, allow_null=True)
    admin_override = serializers.BooleanField(read_only=True)
    notes = serializers.CharField(read_only=True, allow_blank=True)
    is_checked_in = serializers.BooleanField(read_only=True)
    is_checked_out = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def get_user_email(self, obj):
        return obj.user.email

    def get_user_name(self, obj):
        try:
            p = obj.user.employee_profile
            return f"{p.first_name} {p.last_name}".strip() or obj.user.email
        except Exception:
            return obj.user.email


class FaceCheckInSerializer(serializers.Serializer):
    """Request body for face-based check-in / check-out."""
    image_data = serializers.CharField(required=True, help_text="Base64-encoded image")


class TodayStatusResponseSerializer(serializers.Serializer):
    """Response shape for today's attendance status."""
    has_record = serializers.BooleanField()
    is_checked_in = serializers.BooleanField()
    is_checked_out = serializers.BooleanField()
    attendance = serializers.DictField(required=False, allow_null=True)


class AdminMarkAttendanceSerializer(serializers.Serializer):
    """Admin manual override request."""
    user_id = serializers.CharField(required=True)
    date = serializers.DateField(required=True)
    status = serializers.ChoiceField(choices=['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE'])
    check_in_time = serializers.DateTimeField(required=False, allow_null=True)
    check_out_time = serializers.DateTimeField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class AttendanceHistoryQuerySerializer(serializers.Serializer):
    """Query params for history endpoint."""
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    limit = serializers.IntegerField(required=False, default=30, min_value=1, max_value=100)


# ── Phase 13 – Statistics serializers ────────────────────────────────

class PersonalStatsQuerySerializer(serializers.Serializer):
    year = serializers.IntegerField(required=False, min_value=2000, max_value=2100)
    month = serializers.IntegerField(required=False, min_value=1, max_value=12)


class WeeklyStatsQuerySerializer(serializers.Serializer):
    ref_date = serializers.DateField(required=False)


class AdminListQuerySerializer(serializers.Serializer):
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    status = serializers.ChoiceField(
        choices=['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE', ''],
        required=False,
        allow_blank=True,
    )
    user_id = serializers.CharField(required=False, allow_blank=True)
    page = serializers.IntegerField(required=False, default=1, min_value=1)
    page_size = serializers.IntegerField(required=False, default=20, min_value=1, max_value=100)


class CompanyMonthlyQuerySerializer(serializers.Serializer):
    year = serializers.IntegerField(required=False, min_value=2000, max_value=2100)
    month = serializers.IntegerField(required=False, min_value=1, max_value=12)


class RecentDaysQuerySerializer(serializers.Serializer):
    days = serializers.IntegerField(required=False, default=7, min_value=1, max_value=90)
