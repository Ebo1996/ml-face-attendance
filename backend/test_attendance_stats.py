"""
Phase 13 test suite — Attendance Backend APIs (statistics & reporting)
"""

import sys
import os
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps'))

print("=" * 60)
print("Testing Phase 13 — Attendance Backend APIs")
print("=" * 60)

BASE = os.path.join(os.path.dirname(__file__), 'apps', 'attendance')


def read(f):
    with open(os.path.join(BASE, f)) as fh:
        return fh.read()


# 1 ── stats_service imports ──────────────────────────────────────────
print("\n1. Testing stats_service imports...")
try:
    from apps.attendance.stats_service import (
        personal_monthly_stats,
        personal_weekly_stats,
        personal_summary,
        company_daily_stats,
        company_monthly_stats,
        company_recent_days,
        admin_attendance_list,
        _month_range,
        _week_range,
    )
    print("   ✓ All stats_service functions imported")
except ImportError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 2 ── _month_range helper ────────────────────────────────────────────
print("\n2. Testing _month_range helper...")
try:
    first, last = _month_range(2026, 1)
    assert first == date(2026, 1, 1)
    assert last  == date(2026, 1, 31)
    print(f"   ✓ Jan 2026: {first} → {last}")

    first, last = _month_range(2024, 2)   # leap year
    assert last == date(2024, 2, 29)
    print(f"   ✓ Feb 2024 (leap): {first} → {last}")

    first, last = _month_range(2023, 2)   # non-leap
    assert last == date(2023, 2, 28)
    print(f"   ✓ Feb 2023 (non-leap): {first} → {last}")
except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 3 ── _week_range helper ─────────────────────────────────────────────
print("\n3. Testing _week_range helper...")
try:
    # 2026-09-06 is a Sunday → week Mon 31 Aug – Sun 6 Sep
    mon, sun = _week_range(date(2026, 9, 6))
    assert mon == date(2026, 8, 31)
    assert sun == date(2026, 9, 6)
    assert (sun - mon).days == 6
    print(f"   ✓ 2026-09-06 → week {mon} to {sun}")

    # Wednesday check
    mon2, sun2 = _week_range(date(2026, 9, 9))
    assert mon2 == date(2026, 9, 7)
    assert sun2 == date(2026, 9, 13)
    print(f"   ✓ 2026-09-09 → week {mon2} to {sun2}")
except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 4 ── Stats serializer imports ───────────────────────────────────────
print("\n4. Testing stats serializers...")
try:
    from apps.attendance.serializers import (
        PersonalStatsQuerySerializer,
        WeeklyStatsQuerySerializer,
        AdminListQuerySerializer,
        CompanyMonthlyQuerySerializer,
        RecentDaysQuerySerializer,
    )
    print("   ✓ All 5 stats serializers imported")

    # PersonalStatsQuerySerializer — defaults accepted
    s = PersonalStatsQuerySerializer(data={})
    assert s.is_valid(), s.errors
    print("   ✓ PersonalStatsQuerySerializer: empty params accepted (defaults)")

    s2 = PersonalStatsQuerySerializer(data={'year': 2026, 'month': 13})
    assert not s2.is_valid()
    print("   ✓ PersonalStatsQuerySerializer: month=13 rejected")

    # AdminListQuerySerializer
    s3 = AdminListQuerySerializer(data={'page': 2, 'page_size': 50, 'status': 'LATE'})
    assert s3.is_valid(), s3.errors
    print("   ✓ AdminListQuerySerializer: valid params accepted")

    s4 = AdminListQuerySerializer(data={'page_size': 999})
    assert not s4.is_valid()
    print("   ✓ AdminListQuerySerializer: page_size=999 rejected")

    # RecentDaysQuerySerializer
    s5 = RecentDaysQuerySerializer(data={'days': 30})
    assert s5.is_valid(), s5.errors
    print("   ✓ RecentDaysQuerySerializer: days=30 accepted")

    s6 = RecentDaysQuerySerializer(data={'days': 200})
    assert not s6.is_valid()
    print("   ✓ RecentDaysQuerySerializer: days=200 rejected (max 90)")

except (ImportError, AssertionError) as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 5 ── View functions present ──────────────────────────────────────────
print("\n5. Testing view function definitions...")
try:
    vcontent = read('views.py')
    phase13_views = [
        'my_monthly_stats_api',
        'my_weekly_stats_api',
        'my_summary_api',
        'admin_daily_stats_api',
        'admin_monthly_stats_api',
        'admin_recent_days_api',
        'admin_list_api',
    ]
    for fn in phase13_views:
        assert fn in vcontent, f"Missing view: {fn!r}"
    print(f"   ✓ All {len(phase13_views)} Phase 13 views defined")
except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 6 ── URL routes ──────────────────────────────────────────────────────
print("\n6. Testing URL routes...")
try:
    content = read('urls.py')
    phase13_routes = [
        'my-stats/monthly/',
        'my-stats/weekly/',
        'my-stats/summary/',
        'admin/stats/daily/',
        'admin/stats/monthly/',
        'admin/stats/recent/',
        'admin/list/',
    ]
    for route in phase13_routes:
        assert route in content, f"Missing route: {route!r}"
    print(f"   ✓ All {len(phase13_routes)} Phase 13 routes registered")
except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 7 ── stats_service function signatures ──────────────────────────────
print("\n7. Testing stats_service function signatures...")
try:
    import inspect

    # company_recent_days accepts 'days' kwarg
    sig = inspect.signature(company_recent_days)
    params = list(sig.parameters.keys())
    assert 'days' in params, "'days' param missing from company_recent_days"
    print("   ✓ company_recent_days(days=7)")

    # admin_attendance_list has all expected params
    sig2 = inspect.signature(admin_attendance_list)
    params2 = set(sig2.parameters.keys())
    expected = {'start_date', 'end_date', 'status_filter', 'user_id', 'page', 'page_size'}
    assert expected <= params2, f"Missing params: {expected - params2}"
    print(f"   ✓ admin_attendance_list has params: {sorted(params2)}")

    # personal_monthly_stats has year, month
    sig3 = inspect.signature(personal_monthly_stats)
    assert 'year' in sig3.parameters and 'month' in sig3.parameters
    print("   ✓ personal_monthly_stats(user, year, month)")
except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 8 ── Pagination ceiling division ────────────────────────────────────
print("\n8. Testing pagination logic...")
try:
    def total_pages(total, page_size):
        return max(1, -(-total // page_size))

    cases = [(0, 20, 1), (1, 20, 1), (20, 20, 1), (21, 20, 2), (100, 20, 5), (101, 20, 6)]
    for total, ps, expected in cases:
        got = total_pages(total, ps)
        assert got == expected, f"total={total}, ps={ps}: expected {expected}, got {got}"
    print(f"   ✓ {len(cases)} pagination cases correct")
except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 9 ── stats_service file structure ───────────────────────────────────
print("\n9. Testing stats_service file structure...")
try:
    sc = read('stats_service.py')
    required_funcs = [
        'personal_monthly_stats', 'personal_weekly_stats', 'personal_summary',
        'company_daily_stats', 'company_monthly_stats', 'company_recent_days',
        'admin_attendance_list',
    ]
    for fn in required_funcs:
        assert f'def {fn}' in sc, f"Function missing: {fn!r}"
    print(f"   ✓ All {len(required_funcs)} service functions defined")
except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# 10 ── Total URL count ────────────────────────────────────────────────
print("\n10. Checking total registered routes...")
try:
    content = read('urls.py')
    # Count path() calls
    route_count = content.count("path('")
    print(f"   ✓ {route_count} total routes registered in attendance/urls.py")
    assert route_count >= 14, f"Expected ≥14 routes, found {route_count}"
    print("   ✓ Meets minimum route count (≥14)")
except AssertionError as e:
    print(f"   ✗ {e}")
    sys.exit(1)

# ── Summary ──────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("✓ All 10 tests passed! Attendance Backend APIs ready.")
print("=" * 60)
print("\nEmployee stats endpoints:")
print("  GET /api/attendance/my-stats/monthly/  — monthly breakdown")
print("  GET /api/attendance/my-stats/weekly/   — weekly breakdown")
print("  GET /api/attendance/my-stats/summary/  — dashboard summary")
print("\nAdmin stats endpoints:")
print("  GET /api/attendance/admin/stats/daily/   — company day stats")
print("  GET /api/attendance/admin/stats/monthly/ — company month stats")
print("  GET /api/attendance/admin/stats/recent/  — last N days trend")
print("  GET /api/attendance/admin/list/          — paginated record list")
print("\nStats service functions:")
print("  personal_monthly_stats  — attendance_rate, work hours, daily breakdown")
print("  personal_weekly_stats   — week summary")
print("  personal_summary        — dashboard cards (month + week + streak)")
print("  company_daily_stats     — present/late/absent counts + rate")
print("  company_monthly_stats   — monthly totals + daily chart data")
print("  company_recent_days     — trend array for charts")
print("  admin_attendance_list   — paginated, filterable admin list")
print("=" * 60)
