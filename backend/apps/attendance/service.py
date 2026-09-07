"""
Attendance Service

Face-recognition-powered check-in and check-out.
"""

import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional, Tuple

from django.utils import timezone

from apps.ml_service.matching_service import get_matching_service

logger = logging.getLogger(__name__)

# How many minutes after the standard start time counts as "Late"
LATE_THRESHOLD_MINUTES = 15
WORK_START_HOUR = 9       # 09:00
HALF_DAY_HOURS = 4.0      # worked < 4 h → HALF_DAY


class AttendanceService:
    """Face-recognition-powered attendance service."""

    # ── Check-in ─────────────────────────────────────────────────────

    def check_in(self, user, image_data: str) -> Dict[str, Any]:
        """
        Mark check-in for *user* using face recognition.

        Returns a result dict:
            success, action, attendance (record data), message, error
        """
        from .models import AttendanceRecord  # lazy import

        today = timezone.localdate()

        # 1. Verify face
        matching = get_matching_service()
        result = matching.verify(image_data, user)

        if not result['success']:
            return {'success': False, 'error': result.get('error', 'Face verification failed')}

        if not result['is_match']:
            return {
                'success': False,
                'error': (
                    f"Face not recognised (similarity={result['similarity']:.2f}). "
                    "Please try again with a clearer photo."
                ),
            }

        # 2. Get or create today's record
        record, created = AttendanceRecord.objects.get_or_create(
            user=user,
            date=today,
            defaults={
                'status': 'PRESENT',
                'check_in_method': 'FACE_RECOGNITION',
            },
        )

        if not created and record.is_checked_in:
            return {
                'success': True,
                'action': 'ALREADY_CHECKED_IN',
                'message': f"Already checked in at {record.check_in_time.strftime('%H:%M')}",
                'attendance': _serialize_record(record),
            }

        # 3. Set check-in fields
        now = timezone.now()
        record.check_in_time = now
        record.check_in_method = 'FACE_RECOGNITION'
        record.check_in_similarity = result['similarity']
        record.check_in_confidence = result['confidence_level']

        # 4. Determine LATE status
        work_start = now.replace(hour=WORK_START_HOUR, minute=0, second=0, microsecond=0)
        if now > work_start + timedelta(minutes=LATE_THRESHOLD_MINUTES):
            record.status = 'LATE'
        else:
            record.status = 'PRESENT'

        record.save()

        logger.info(
            f"Check-in: user={user.email}, date={today}, "
            f"status={record.status}, similarity={result['similarity']:.4f}"
        )

        return {
            'success': True,
            'action': 'CHECKED_IN',
            'message': f"Check-in successful ({record.status})",
            'attendance': _serialize_record(record),
        }

    # ── Check-out ────────────────────────────────────────────────────

    def check_out(self, user, image_data: str) -> Dict[str, Any]:
        """
        Mark check-out for *user* using face recognition.
        """
        from .models import AttendanceRecord  # lazy import

        today = timezone.localdate()

        # 1. Verify face
        matching = get_matching_service()
        result = matching.verify(image_data, user)

        if not result['success']:
            return {'success': False, 'error': result.get('error', 'Face verification failed')}

        if not result['is_match']:
            return {
                'success': False,
                'error': (
                    f"Face not recognised (similarity={result['similarity']:.2f}). "
                    "Please try again."
                ),
            }

        # 2. Must have checked in first
        try:
            record = AttendanceRecord.objects.get(user=user, date=today)
        except AttendanceRecord.DoesNotExist:
            return {
                'success': False,
                'error': "No check-in found for today. Please check in first.",
            }

        if not record.is_checked_in:
            return {'success': False, 'error': "You have not checked in today."}

        if record.is_checked_out:
            return {
                'success': True,
                'action': 'ALREADY_CHECKED_OUT',
                'message': f"Already checked out at {record.check_out_time.strftime('%H:%M')}",
                'attendance': _serialize_record(record),
            }

        # 3. Set check-out fields
        now = timezone.now()
        record.check_out_time = now
        record.check_out_method = 'FACE_RECOGNITION'
        record.check_out_similarity = result['similarity']
        record.check_out_confidence = result['confidence_level']

        # 4. Compute work hours and update status if needed
        hours = record.compute_work_hours()
        record.work_hours = hours
        if hours is not None and hours < HALF_DAY_HOURS and record.status == 'PRESENT':
            record.status = 'HALF_DAY'

        record.save()

        logger.info(
            f"Check-out: user={user.email}, date={today}, "
            f"hours={hours}, similarity={result['similarity']:.4f}"
        )

        return {
            'success': True,
            'action': 'CHECKED_OUT',
            'message': f"Check-out successful. Worked {hours:.1f} hours." if hours else "Check-out successful.",
            'attendance': _serialize_record(record),
        }

    # ── Today's status ────────────────────────────────────────────────

    def get_today_status(self, user) -> Dict[str, Any]:
        """Return today's attendance status for *user*."""
        from .models import AttendanceRecord  # lazy import

        today = timezone.localdate()
        try:
            record = AttendanceRecord.objects.get(user=user, date=today)
            return {
                'has_record': True,
                'is_checked_in': record.is_checked_in,
                'is_checked_out': record.is_checked_out,
                'attendance': _serialize_record(record),
            }
        except AttendanceRecord.DoesNotExist:
            return {
                'has_record': False,
                'is_checked_in': False,
                'is_checked_out': False,
                'attendance': None,
            }

    # ── Employee history ──────────────────────────────────────────────

    def get_user_history(
        self,
        user,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 30,
    ):
        """Return attendance records for *user*, newest first."""
        from .models import AttendanceRecord  # lazy import

        qs = AttendanceRecord.objects.filter(user=user).order_by('-date')
        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)
        return list(qs[:limit])

    # ── Admin: manual override ────────────────────────────────────────

    def admin_mark_attendance(
        self,
        user,
        attendance_date: date,
        status: str,
        check_in_time=None,
        check_out_time=None,
        notes: str = '',
    ) -> Tuple[bool, Any, Optional[str]]:
        """Admin manually sets an attendance record."""
        from .models import AttendanceRecord  # lazy import

        record, _ = AttendanceRecord.objects.get_or_create(
            user=user,
            date=attendance_date,
            defaults={'status': status, 'admin_override': True},
        )

        record.status = status
        record.admin_override = True
        if check_in_time:
            record.check_in_time = check_in_time
            record.check_in_method = 'MANUAL_ADMIN'
        if check_out_time:
            record.check_out_time = check_out_time
            record.check_out_method = 'MANUAL_ADMIN'
        record.work_hours = record.compute_work_hours()
        record.notes = notes
        record.save()

        return True, _serialize_record(record), None

    # ── Face-recognition-triggered helpers ───────────────────────────
    # Called by the recognition API after identity has already been
    # confirmed by the ML matching engine.

    def check_in_without_face(self, user) -> Dict[str, Any]:
        """Mark check-in for *user* (face already verified by caller)."""
        from .models import AttendanceRecord

        today = timezone.localdate()
        now   = timezone.now()

        record, created = AttendanceRecord.objects.get_or_create(
            user=user, date=today,
            defaults={'status': 'PRESENT', 'check_in_method': 'FACE_RECOGNITION'},
        )

        if not created and record.is_checked_in:
            return {
                'success': True,
                'action': 'ALREADY_CHECKED_IN',
                'message': f"Already checked in at {record.check_in_time.strftime('%H:%M')}",
                'attendance': _serialize_record(record),
            }

        work_start = now.replace(hour=WORK_START_HOUR, minute=0, second=0, microsecond=0)
        record.check_in_time     = now
        record.check_in_method   = 'FACE_RECOGNITION'
        record.status = 'LATE' if now > work_start + timedelta(minutes=LATE_THRESHOLD_MINUTES) else 'PRESENT'
        record.save()

        return {
            'success': True,
            'action': 'CHECKED_IN',
            'message': f"Check-in successful ({record.status})",
            'attendance': _serialize_record(record),
        }

    def check_out_without_face(self, user) -> Dict[str, Any]:
        """Mark check-out for *user* (face already verified by caller)."""
        from .models import AttendanceRecord

        today = timezone.localdate()
        try:
            record = AttendanceRecord.objects.get(user=user, date=today)
        except AttendanceRecord.DoesNotExist:
            return {'success': False, 'error': 'No check-in found for today.'}

        if not record.is_checked_in:
            return {'success': False, 'error': 'You have not checked in today.'}

        if record.is_checked_out:
            return {
                'success': True,
                'action': 'ALREADY_CHECKED_OUT',
                'message': f"Already checked out at {record.check_out_time.strftime('%H:%M')}",
                'attendance': _serialize_record(record),
            }

        now = timezone.now()
        record.check_out_time   = now
        record.check_out_method = 'FACE_RECOGNITION'
        record.work_hours       = record.compute_work_hours()
        if record.work_hours is not None and record.work_hours < HALF_DAY_HOURS and record.status == 'PRESENT':
            record.status = 'HALF_DAY'
        record.save()

        return {
            'success': True,
            'action': 'CHECKED_OUT',
            'message': f"Check-out successful. Worked {record.work_hours:.1f}h." if record.work_hours else "Check-out successful.",
            'attendance': _serialize_record(record),
        }


# ── Helper ────────────────────────────────────────────────────────────

def _serialize_record(record) -> Dict[str, Any]:
    """Convert an AttendanceRecord to a plain dict."""
    return {
        'id': record.id,
        'user_id': str(record.user_id),
        'date': str(record.date),
        'status': record.status,
        'check_in_time': record.check_in_time.isoformat() if record.check_in_time else None,
        'check_out_time': record.check_out_time.isoformat() if record.check_out_time else None,
        'check_in_similarity': record.check_in_similarity,
        'check_in_confidence': record.check_in_confidence,
        'check_out_similarity': record.check_out_similarity,
        'check_out_confidence': record.check_out_confidence,
        'work_hours': record.work_hours,
        'check_in_method': record.check_in_method,
        'check_out_method': record.check_out_method,
        'admin_override': record.admin_override,
        'notes': record.notes,
        'created_at': record.created_at.isoformat(),
        'updated_at': record.updated_at.isoformat(),
    }


# ── Singleton ─────────────────────────────────────────────────────────

_service: Optional[AttendanceService] = None


def get_attendance_service() -> AttendanceService:
    global _service
    if _service is None:
        _service = AttendanceService()
    return _service
