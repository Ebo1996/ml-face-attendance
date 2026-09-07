"""
Tests for attendance app — AttendanceRecord model, service logic, and endpoints.
Run: python manage.py test apps.attendance
"""

from datetime import date, timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from .models import AttendanceRecord
from .service import AttendanceService, LATE_THRESHOLD_MINUTES, WORK_START_HOUR, HALF_DAY_HOURS

User = get_user_model()


# ── Helpers ──────────────────────────────────────────────────────────────────

def make_user(email='att@example.com', password='TestPass1234!'):
    return User.objects.create_user(email=email, password=password)


def make_record(user, attendance_date=None, **kwargs):
    """Create an AttendanceRecord for testing."""
    if attendance_date is None:
        attendance_date = date.today()
    return AttendanceRecord.objects.create(
        user=user,
        date=attendance_date,
        **kwargs,
    )


# ── AttendanceRecord model tests ─────────────────────────────────────────────

class AttendanceRecordModelTests(TestCase):

    def setUp(self):
        self.user = make_user()

    def test_create_record(self):
        record = make_record(self.user, status='PRESENT')
        self.assertEqual(record.user, self.user)
        self.assertEqual(record.status, 'PRESENT')
        self.assertFalse(record.is_checked_in)
        self.assertFalse(record.is_checked_out)

    def test_is_checked_in_property(self):
        record = make_record(self.user)
        self.assertFalse(record.is_checked_in)
        record.check_in_time = timezone.now()
        record.save()
        self.assertTrue(record.is_checked_in)

    def test_is_checked_out_property(self):
        record = make_record(self.user)
        self.assertFalse(record.is_checked_out)
        record.check_out_time = timezone.now()
        record.save()
        self.assertTrue(record.is_checked_out)

    def test_compute_work_hours(self):
        record = make_record(self.user)
        now = timezone.now()
        record.check_in_time = now
        record.check_out_time = now + timedelta(hours=8)
        self.assertAlmostEqual(record.compute_work_hours(), 8.0, places=1)

    def test_compute_work_hours_no_checkout(self):
        record = make_record(self.user)
        record.check_in_time = timezone.now()
        self.assertIsNone(record.compute_work_hours())

    def test_compute_work_hours_no_checkin(self):
        record = make_record(self.user)
        self.assertIsNone(record.compute_work_hours())

    def test_str(self):
        record = make_record(self.user, status='LATE')
        self.assertIn(self.user.email, str(record))
        self.assertIn('LATE', str(record))

    def test_unique_per_user_per_date(self):
        """Only one record allowed per user per date."""
        today = date.today()
        make_record(self.user, attendance_date=today)
        with self.assertRaises(Exception):
            make_record(self.user, attendance_date=today)

    def test_id_is_auto_generated(self):
        record = make_record(self.user)
        self.assertIsNotNone(record.id)
        self.assertGreater(len(record.id), 0)

    def test_similarity_validators_accept_valid_range(self):
        from django.core.exceptions import ValidationError
        record = make_record(self.user)
        record.check_in_similarity = 0.95
        record.full_clean()  # should not raise

    def test_work_hours_precision(self):
        record = make_record(self.user)
        now = timezone.now()
        record.check_in_time = now
        record.check_out_time = now + timedelta(hours=4, minutes=30)
        hours = record.compute_work_hours()
        self.assertAlmostEqual(hours, 4.5, places=1)


# ── AttendanceService logic tests ────────────────────────────────────────────

class AttendanceServiceLogicTests(TestCase):
    """Unit tests for AttendanceService using mocked face verification."""

    def setUp(self):
        self.user = make_user('svc@example.com')
        self.service = AttendanceService()

    def _mock_verify_success(self, similarity=0.95):
        return {
            'success': True,
            'is_match': True,
            'similarity': similarity,
            'confidence_level': 'HIGH',
        }

    def _mock_verify_fail(self):
        return {
            'success': True,
            'is_match': False,
            'similarity': 0.3,
            'confidence_level': 'LOW',
        }

    @patch('apps.attendance.service.get_matching_service')
    def test_check_in_success(self, mock_ms):
        mock_ms.return_value.verify.return_value = self._mock_verify_success()
        result = self.service.check_in(self.user, 'data:image/jpeg;base64,fake')
        self.assertTrue(result['success'])
        self.assertEqual(result['action'], 'CHECKED_IN')
        record = AttendanceRecord.objects.get(user=self.user, date=date.today())
        self.assertIsNotNone(record.check_in_time)

    @patch('apps.attendance.service.get_matching_service')
    def test_check_in_face_not_recognised(self, mock_ms):
        mock_ms.return_value.verify.return_value = self._mock_verify_fail()
        result = self.service.check_in(self.user, 'data:image/jpeg;base64,fake')
        self.assertFalse(result['success'])
        self.assertIn('error', result)

    @patch('apps.attendance.service.get_matching_service')
    def test_check_in_already_checked_in(self, mock_ms):
        mock_ms.return_value.verify.return_value = self._mock_verify_success()
        self.service.check_in(self.user, 'fake')
        result = self.service.check_in(self.user, 'fake')
        self.assertTrue(result['success'])
        self.assertEqual(result['action'], 'ALREADY_CHECKED_IN')

    @patch('apps.attendance.service.get_matching_service')
    def test_check_out_success(self, mock_ms):
        mock_ms.return_value.verify.return_value = self._mock_verify_success()
        self.service.check_in(self.user, 'fake')
        result = self.service.check_out(self.user, 'fake')
        self.assertTrue(result['success'])
        self.assertEqual(result['action'], 'CHECKED_OUT')
        record = AttendanceRecord.objects.get(user=self.user, date=date.today())
        self.assertIsNotNone(record.check_out_time)
        self.assertIsNotNone(record.work_hours)

    @patch('apps.attendance.service.get_matching_service')
    def test_check_out_without_check_in_fails(self, mock_ms):
        mock_ms.return_value.verify.return_value = self._mock_verify_success()
        result = self.service.check_out(self.user, 'fake')
        self.assertFalse(result['success'])
        self.assertIn('No check-in', result['error'])

    @patch('apps.attendance.service.get_matching_service')
    def test_late_status_set_correctly(self, mock_ms):
        """Check-in after threshold should be marked LATE."""
        mock_ms.return_value.verify.return_value = self._mock_verify_success()
        # Simulate a very late check-in time
        now = timezone.now()
        late_time = now.replace(
            hour=WORK_START_HOUR + 2, minute=0, second=0, microsecond=0
        )
        with patch('apps.attendance.service.timezone') as mock_tz:
            mock_tz.now.return_value = late_time
            mock_tz.localdate.return_value = date.today()
            result = self.service.check_in(self.user, 'fake')
        self.assertTrue(result['success'])
        record = AttendanceRecord.objects.get(user=self.user, date=date.today())
        self.assertEqual(record.status, 'LATE')

    @patch('apps.attendance.service.get_matching_service')
    def test_half_day_status_on_early_checkout(self, mock_ms):
        """Short work hours should downgrade status to HALF_DAY."""
        mock_ms.return_value.verify.return_value = self._mock_verify_success()
        self.service.check_in(self.user, 'fake')
        record = AttendanceRecord.objects.get(user=self.user, date=date.today())
        # Manually set short hours
        record.check_in_time = timezone.now()
        record.save()
        with patch('apps.attendance.service.timezone') as mock_tz:
            mock_tz.now.return_value = record.check_in_time + timedelta(hours=2)
            mock_tz.localdate.return_value = date.today()
            result = self.service.check_out(self.user, 'fake')
        self.assertTrue(result['success'])
        record.refresh_from_db()
        self.assertEqual(record.status, 'HALF_DAY')

    def test_get_today_status_no_record(self):
        result = self.service.get_today_status(self.user)
        self.assertFalse(result['has_record'])
        self.assertFalse(result['is_checked_in'])
        self.assertIsNone(result['attendance'])

    @patch('apps.attendance.service.get_matching_service')
    def test_get_today_status_after_check_in(self, mock_ms):
        mock_ms.return_value.verify.return_value = self._mock_verify_success()
        self.service.check_in(self.user, 'fake')
        result = self.service.get_today_status(self.user)
        self.assertTrue(result['has_record'])
        self.assertTrue(result['is_checked_in'])
        self.assertFalse(result['is_checked_out'])

    def test_admin_mark_attendance(self):
        ok, record_data, err = self.service.admin_mark_attendance(
            user=self.user,
            attendance_date=date.today(),
            status='PRESENT',
            notes='Admin test',
        )
        self.assertTrue(ok)
        self.assertIsNone(err)
        self.assertEqual(record_data['status'], 'PRESENT')
        self.assertTrue(record_data['admin_override'])

    def test_get_user_history_empty(self):
        history = self.service.get_user_history(self.user)
        self.assertEqual(history, [])

    def test_get_user_history_returns_records(self):
        for i in range(3):
            make_record(
                self.user,
                attendance_date=date.today() - timedelta(days=i),
                status='PRESENT',
            )
        history = self.service.get_user_history(self.user, limit=10)
        self.assertEqual(len(history), 3)

    def test_get_user_history_date_filter(self):
        today = date.today()
        for i in range(5):
            make_record(
                self.user,
                attendance_date=today - timedelta(days=i),
                status='PRESENT',
            )
        # Only records from today and yesterday
        history = self.service.get_user_history(
            self.user,
            start_date=today - timedelta(days=1),
            end_date=today,
        )
        self.assertEqual(len(history), 2)


# ── Attendance API endpoint tests ────────────────────────────────────────────

class AttendanceEndpointTests(APITestCase):
    """Endpoint-level tests for attendance APIs."""

    TODAY_URL   = '/api/attendance/today/'
    HISTORY_URL = '/api/attendance/history/'

    def _register_and_auth(self, email='attep@example.com'):
        resp = self.client.post('/api/auth/register/', {
            'email': email,
            'password': 'TestPass1234!',
            'password_confirm': 'TestPass1234!',
            'role': 'EMPLOYEE',
        }, format='json')
        token = resp.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return resp.data['user']

    def test_today_status_requires_auth(self):
        resp = self.client.get(self.TODAY_URL)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_today_status_authenticated(self):
        self._register_and_auth('today@example.com')
        resp = self.client.get(self.TODAY_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('has_record', resp.data)

    def test_history_requires_auth(self):
        resp = self.client.get(self.HISTORY_URL)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_history_returns_list(self):
        self._register_and_auth('hist@example.com')
        resp = self.client.get(self.HISTORY_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
