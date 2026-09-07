"""
Attendance URL Configuration
"""

from django.urls import path
from . import views

app_name = 'attendance'

urlpatterns = [
    # ── Spec canonical endpoints ──────────────────────────────────────
    path('',                    views.attendance_list_api,    name='attendance-list'),
    path('<str:record_id>/',    views.attendance_detail_api,  name='attendance-detail'),

    # ── Employee: check-in / check-out ────────────────────────────────
    path('check-in/',   views.check_in_api,     name='check-in'),
    path('check-out/',  views.check_out_api,    name='check-out'),
    path('today/',      views.today_status_api, name='today-status'),
    path('my-history/', views.my_history_api,   name='my-history'),

    # ── Employee: personal stats (Phase 13) ──────────────────────────
    path('my-stats/monthly/', views.my_monthly_stats_api, name='my-monthly-stats'),
    path('my-stats/weekly/',  views.my_weekly_stats_api,  name='my-weekly-stats'),
    path('my-stats/summary/', views.my_summary_api,       name='my-summary'),

    # ── Admin: basic ─────────────────────────────────────────────────
    path('admin/mark/',               views.admin_mark_attendance_api,    name='admin-mark'),
    path('admin/today/',              views.admin_today_overview_api,     name='admin-today'),
    path('admin/employee/<str:user_id>/', views.admin_employee_attendance_api, name='admin-employee'),

    # ── Admin: statistics (Phase 13) ─────────────────────────────────
    path('admin/stats/daily/',   views.admin_daily_stats_api,   name='admin-daily-stats'),
    path('admin/stats/monthly/', views.admin_monthly_stats_api, name='admin-monthly-stats'),
    path('admin/stats/recent/',  views.admin_recent_days_api,   name='admin-recent-days'),
    path('admin/list/',          views.admin_list_api,          name='admin-list'),

    # ── Reports / CSV export (Phase 19) ──────────────────────────────
    path('export/my/',    views.export_my_attendance_csv, name='export-my'),
    path('export/admin/', views.admin_export_csv,         name='export-admin'),
]
