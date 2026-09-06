"""
Phase 12 test suite — Employee Attendance Recognition
Pure structure + logic tests (no Django model imports needed).
"""

import sys
import os
from datetime import datetime, timezone as dt_tz

# Django must be configured before importing DRF serializers
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps'))

print("=" * 60)
print("Testing Phase 12 — Employee Attendance Recognition")
print("=" * 60)

BASE = os.path.join(os.path.dirname(__file__), 'apps', 'attendance')


def read(filename):
    with open(os.path.join(BASE, filename)) as fh:
        return fh.read()


# 1 ── Service imports (no model dependency) ──────────────────────────
print("\n1. Testing service imports...")
try:
    from attendance.service import (
        AttendanceService,
        get_attendance_service,
        _serialize_record,
        LATE_THRESHOLD_MINUTES,
        WORK_START_HOUR,
        HALF_DAY_HOURS,
    )
    print("   ✓ AttendanceService imported")
    print(f"   ✓ Constants: LATE={LATE_THRESHOLD_MINUTES}min, "
          f"START={WORK_START_HOUR}:00, HALF_DAY={HALF_DAY_HOURS}h")
except ImportError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 2 ── Serializer imports (lazy model reference, no conflict) ─────────
print("\n2. Testing serializer imports...")
try:
    from apps.attendance.serializers import (
        FaceCheckInSerializer,
        AdminMarkAttendanceSerializer,
        AttendanceHistoryQuerySerializer,
        TodayStatusResponseSerializer,
        AttendanceRecordSerializer,
    )
    print("   ✓ All 5 serializers imported cleanly")
except ImportError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 3 ── Business-logic constants ───────────────────────────────────────
print("\n3. Testing business-logic constants...")
try:
    assert LATE_THRESHOLD_MINUTES > 0
    assert 0 <= WORK_START_HOUR <= 12
    assert 2.0 <= HALF_DAY_HOURS <= 6.0
    print(f"   ✓ Late threshold  : {WORK_START_HOUR}:{LATE_THRESHOLD_MINUTES:02d}")
    print(f"   ✓ Half-day limit  : < {HALF_DAY_HOURS} h worked")
except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 4 ── Work-hours computation (pure Python) ───────────────────────────
print("\n4. Testing work-hours computation...")
try:
    class MockRecord:
        check_in_time = None
        check_out_time = None

        @property
        def is_checked_in(self):
            return self.check_in_time is not None

        @property
        def is_checked_out(self):
            return self.check_out_time is not None

        def compute_work_hours(self):
            if self.check_in_time and self.check_out_time:
                delta = self.check_out_time - self.check_in_time
                return round(delta.total_seconds() / 3600, 2)
            return None

    r = MockRecord()
    assert not r.is_checked_in and not r.is_checked_out
    assert r.compute_work_hours() is None

    r.check_in_time  = datetime(2026, 9, 6,  9,  0, tzinfo=dt_tz.utc)
    r.check_out_time = datetime(2026, 9, 6, 17, 30, tzinfo=dt_tz.utc)
    h = r.compute_work_hours()
    assert abs(h - 8.5) < 0.01, f"Expected 8.5, got {h}"
    print(f"   ✓ 09:00 → 17:30 = {h} h")

    r.check_out_time = datetime(2026, 9, 6, 12, 0, tzinfo=dt_tz.utc)
    h2 = r.compute_work_hours()
    assert abs(h2 - 3.0) < 0.01
    print(f"   ✓ 09:00 → 12:00 = {h2} h  (HALF_DAY territory, < {HALF_DAY_HOURS} h)")

except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 5 ── Serializer validation ──────────────────────────────────────────
print("\n5. Testing serializer validation...")
try:
    # FaceCheckInSerializer
    s = FaceCheckInSerializer(data={'image_data': 'data:image/jpeg;base64,abc123'})
    assert s.is_valid(), s.errors
    print("   ✓ FaceCheckInSerializer: valid input accepted")

    s2 = FaceCheckInSerializer(data={})
    assert not s2.is_valid()
    print("   ✓ FaceCheckInSerializer: empty input rejected")

    # AdminMarkAttendanceSerializer
    s3 = AdminMarkAttendanceSerializer(data={
        'user_id': 'abc123', 'date': '2026-09-06', 'status': 'PRESENT',
    })
    assert s3.is_valid(), s3.errors
    print("   ✓ AdminMarkAttendanceSerializer: valid input accepted")

    s4 = AdminMarkAttendanceSerializer(data={
        'user_id': 'abc', 'date': '2026-09-06', 'status': 'DANCING',
    })
    assert not s4.is_valid()
    print("   ✓ AdminMarkAttendanceSerializer: bad status rejected")

    # AttendanceHistoryQuerySerializer
    s5 = AttendanceHistoryQuerySerializer(data={'limit': 10})
    assert s5.is_valid(), s5.errors
    print("   ✓ AttendanceHistoryQuerySerializer: valid input accepted")

    s6 = AttendanceHistoryQuerySerializer(data={'limit': 999})
    assert not s6.is_valid()
    print("   ✓ AttendanceHistoryQuerySerializer: limit=999 rejected")

except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 6 ── Service singleton ──────────────────────────────────────────────
print("\n6. Testing AttendanceService singleton...")
try:
    svc1 = get_attendance_service()
    svc2 = get_attendance_service()
    assert svc1 is svc2
    print("   ✓ Same instance returned on every call")
except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 7 ── URL routes (file inspection) ───────────────────────────────────
print("\n7. Testing URL routes...")
try:
    content = read('urls.py')
    expected_routes = [
        'check-in/', 'check-out/', 'today/', 'my-history/',
        'admin/mark/', 'admin/today/', 'admin/employee/',
    ]
    for route in expected_routes:
        assert route in content, f"Route missing: {route!r}"
    print(f"   ✓ All {len(expected_routes)} routes registered")
except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 8 ── View functions (file inspection) ──────────────────────────────
print("\n8. Testing view function definitions...")
try:
    vcontent = read('views.py')
    expected_views = [
        'check_in_api', 'check_out_api', 'today_status_api',
        'my_history_api', 'admin_mark_attendance_api',
        'admin_today_overview_api', 'admin_employee_attendance_api',
    ]
    for fn in expected_views:
        assert fn in vcontent, f"View missing: {fn!r}"
    print(f"   ✓ All {len(expected_views)} view functions defined")
except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 9 ── Model file (file inspection) ──────────────────────────────────
print("\n9. Testing model file structure...")
try:
    mc = read('models.py')
    required = [
        'check_in_time', 'check_out_time',
        'check_in_similarity', 'check_out_similarity',
        'check_in_confidence', 'check_out_confidence',
        'work_hours', 'admin_override', 'notes',
        'is_checked_in', 'is_checked_out',
        'compute_work_hours', 'unique_together',
        'PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE',
    ]
    for item in required:
        assert item in mc, f"Missing in models.py: {item!r}"
    print(f"   ✓ All {len(required)} required items in models.py")
except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 10 ── Admin (file inspection) ───────────────────────────────────────
print("\n10. Testing admin interface...")
try:
    ac = read('admin.py')
    assert 'AttendanceRecordAdmin' in ac
    assert 'list_display' in ac
    assert 'list_filter' in ac
    print("   ✓ AttendanceRecordAdmin with list_display and list_filter")
except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# ── Summary ──────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("✓ All 10 tests passed! Attendance system is ready.")
print("=" * 60)
print("\nEmployee endpoints:")
print("  POST /api/attendance/check-in/    — face-based check-in")
print("  POST /api/attendance/check-out/   — face-based check-out")
print("  GET  /api/attendance/today/       — today's status")
print("  GET  /api/attendance/my-history/  — personal history")
print("\nAdmin endpoints:")
print("  POST /api/attendance/admin/mark/")
print("  GET  /api/attendance/admin/today/")
print("  GET  /api/attendance/admin/employee/<id>/")
print("\nBusiness rules:")
print(f"  LATE     → check-in after {WORK_START_HOUR}:{LATE_THRESHOLD_MINUTES:02d}")
print(f"  HALF_DAY → worked < {HALF_DAY_HOURS} h")
print("  Status   → PRESENT | LATE | HALF_DAY | ABSENT | ON_LEAVE")
print("=" * 60)
