"""
Attendance Statistics Service

Rich aggregations on top of AttendanceRecord:
  - Personal stats (per employee)
  - Monthly / weekly summaries
  - Company-wide dashboard stats
  - Department breakdowns
"""

from __future__ import annotations

import calendar
from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone


# ── helpers ──────────────────────────────────────────────────────────

def _month_range(year: int, month: int):
    """Return (first_day, last_day) for a given year/month."""
    _, last = calendar.monthrange(year, month)
    return date(year, month, 1), date(year, month, last)


def _week_range(ref: date):
    """Return (monday, sunday) of the ISO week containing *ref*."""
    monday = ref - timedelta(days=ref.weekday())
    return monday, monday + timedelta(days=6)


# ── Personal statistics ───────────────────────────────────────────────

def personal_monthly_stats(user, year: int, month: int) -> Dict[str, Any]:
    """
    Return attendance statistics for one employee for a calendar month.

    Response keys:
        year, month, working_days, present, late, half_day, absent,
        on_leave, attendance_rate, avg_work_hours, total_work_hours,
        records  (list of daily dicts)
    """
    from .models import AttendanceRecord

    first, last = _month_range(year, month)
    records = (
        AttendanceRecord.objects.filter(user=user, date__range=(first, last))
        .order_by('date')
    )

    totals = {s: 0 for s in ('PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE')}
    work_hours_list: List[float] = []

    daily: List[Dict] = []
    for r in records:
        totals[r.status] = totals.get(r.status, 0) + 1
        if r.work_hours:
            work_hours_list.append(r.work_hours)
        daily.append({
            'date': str(r.date),
            'status': r.status,
            'check_in_time': r.check_in_time.isoformat() if r.check_in_time else None,
            'check_out_time': r.check_out_time.isoformat() if r.check_out_time else None,
            'work_hours': r.work_hours,
        })

    working_days = records.count()
    present_days = totals['PRESENT'] + totals['LATE'] + totals['HALF_DAY']
    attendance_rate = round(present_days / working_days * 100, 1) if working_days else 0.0
    total_work_hours = round(sum(work_hours_list), 2) if work_hours_list else 0.0
    avg_work_hours = round(total_work_hours / len(work_hours_list), 2) if work_hours_list else 0.0

    return {
        'year': year,
        'month': month,
        'working_days': working_days,
        **totals,
        'attendance_rate': attendance_rate,
        'avg_work_hours': avg_work_hours,
        'total_work_hours': total_work_hours,
        'records': daily,
    }


def personal_weekly_stats(user, ref_date: Optional[date] = None) -> Dict[str, Any]:
    """Return attendance stats for one employee for the ISO week containing *ref_date*."""
    from .models import AttendanceRecord

    if ref_date is None:
        ref_date = timezone.localdate()
    monday, sunday = _week_range(ref_date)

    records = (
        AttendanceRecord.objects.filter(user=user, date__range=(monday, sunday))
        .order_by('date')
    )

    totals = {s: 0 for s in ('PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE')}
    total_hours = 0.0
    daily = []
    for r in records:
        totals[r.status] = totals.get(r.status, 0) + 1
        if r.work_hours:
            total_hours += r.work_hours
        daily.append({
            'date': str(r.date),
            'status': r.status,
            'work_hours': r.work_hours,
        })

    return {
        'week_start': str(monday),
        'week_end': str(sunday),
        'days_recorded': records.count(),
        **totals,
        'total_work_hours': round(total_hours, 2),
        'records': daily,
    }


def personal_summary(user) -> Dict[str, Any]:
    """
    Lightweight summary: this month + this week + streak stats.
    Used for the employee dashboard cards.
    """
    today = timezone.localdate()
    month_stats = personal_monthly_stats(user, today.year, today.month)
    week_stats = personal_weekly_stats(user, today)

    from .models import AttendanceRecord

    # On-time streak (consecutive PRESENT days ending today, backwards)
    streak = 0
    check_date = today
    while True:
        try:
            r = AttendanceRecord.objects.get(user=user, date=check_date)
            if r.status in ('PRESENT',):
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
        except AttendanceRecord.DoesNotExist:
            break

    return {
        'today': str(today),
        'this_month': {
            'attendance_rate': month_stats['attendance_rate'],
            'present': month_stats['PRESENT'],
            'late': month_stats['LATE'],
            'half_day': month_stats['HALF_DAY'],
            'total_work_hours': month_stats['total_work_hours'],
        },
        'this_week': {
            'days_recorded': week_stats['days_recorded'],
            'total_work_hours': week_stats['total_work_hours'],
        },
        'on_time_streak': streak,
    }


# ── Company-wide statistics ───────────────────────────────────────────

def company_daily_stats(target_date: Optional[date] = None) -> Dict[str, Any]:
    """Aggregated attendance stats for *all* employees on a given date."""
    from .models import AttendanceRecord
    from django.contrib.auth import get_user_model
    User = get_user_model()

    if target_date is None:
        target_date = timezone.localdate()

    total_employees = User.objects.filter(is_active=True).count()
    records = AttendanceRecord.objects.filter(date=target_date)

    checked_in = records.count()
    present = records.filter(status='PRESENT').count()
    late = records.filter(status='LATE').count()
    half_day = records.filter(status='HALF_DAY').count()
    on_leave = records.filter(status='ON_LEAVE').count()
    absent = total_employees - checked_in - on_leave

    avg_hours_qs = records.filter(work_hours__isnull=False).aggregate(avg=Avg('work_hours'))
    avg_hours = round(avg_hours_qs['avg'] or 0.0, 2)

    attendance_rate = round(checked_in / total_employees * 100, 1) if total_employees else 0.0

    return {
        'date': str(target_date),
        'total_employees': total_employees,
        'checked_in': checked_in,
        'absent': max(absent, 0),
        'present': present,
        'late': late,
        'half_day': half_day,
        'on_leave': on_leave,
        'attendance_rate': attendance_rate,
        'avg_work_hours': avg_hours,
    }


def company_monthly_stats(year: int, month: int) -> Dict[str, Any]:
    """
    Company-wide stats for a calendar month.
    Includes daily breakdown (for charts) and overall totals.
    """
    from .models import AttendanceRecord
    from django.contrib.auth import get_user_model
    User = get_user_model()

    first, last = _month_range(year, month)
    total_employees = User.objects.filter(is_active=True).count()
    records = AttendanceRecord.objects.filter(date__range=(first, last))

    total_records = records.count()
    present = records.filter(status__in=['PRESENT', 'LATE']).count()
    late = records.filter(status='LATE').count()
    half_day = records.filter(status='HALF_DAY').count()
    on_leave = records.filter(status='ON_LEAVE').count()

    avg_rate = round(present / total_records * 100, 1) if total_records else 0.0
    avg_hours_qs = records.filter(work_hours__isnull=False).aggregate(avg=Avg('work_hours'))
    avg_hours = round(avg_hours_qs['avg'] or 0.0, 2)

    # Daily breakdown for charting
    daily_data: Dict[str, Dict] = {}
    cur = first
    while cur <= last:
        ds = str(cur)
        daily_data[ds] = {'date': ds, 'present': 0, 'late': 0, 'half_day': 0, 'absent': 0}
        cur += timedelta(days=1)

    for r in records.values('date', 'status'):
        ds = str(r['date'])
        if ds in daily_data:
            s = r['status']
            if s in ('PRESENT', 'LATE'):
                daily_data[ds]['present'] += 1
            if s == 'LATE':
                daily_data[ds]['late'] += 1
            if s == 'HALF_DAY':
                daily_data[ds]['half_day'] += 1

    for ds, d in daily_data.items():
        d['absent'] = max(total_employees - d['present'] - d['half_day'], 0)

    return {
        'year': year,
        'month': month,
        'total_employees': total_employees,
        'total_records': total_records,
        'present': present,
        'late': late,
        'half_day': half_day,
        'on_leave': on_leave,
        'attendance_rate': avg_rate,
        'avg_work_hours': avg_hours,
        'daily_breakdown': list(daily_data.values()),
    }


def company_recent_days(days: int = 7) -> List[Dict[str, Any]]:
    """Return company_daily_stats for the last *days* days (for dashboard charts)."""
    today = timezone.localdate()
    return [
        company_daily_stats(today - timedelta(days=i))
        for i in range(days - 1, -1, -1)
    ]


# ── Paginated admin list ──────────────────────────────────────────────

def admin_attendance_list(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status_filter: Optional[str] = None,
    user_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> Dict[str, Any]:
    """
    Paginated, filterable attendance list for admin dashboard.
    """
    from .models import AttendanceRecord

    qs = AttendanceRecord.objects.select_related('user').order_by('-date', '-check_in_time')

    if start_date:
        qs = qs.filter(date__gte=start_date)
    if end_date:
        qs = qs.filter(date__lte=end_date)
    if status_filter:
        qs = qs.filter(status=status_filter)
    if user_id:
        qs = qs.filter(user_id=user_id)

    total = qs.count()
    offset = (page - 1) * page_size
    records = list(qs[offset: offset + page_size])

    return {
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': max(1, -(-total // page_size)),  # ceiling division
        'records': records,
    }
