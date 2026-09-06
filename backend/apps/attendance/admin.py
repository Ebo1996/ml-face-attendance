"""
Attendance Admin
"""

from django.contrib import admin
from .models import AttendanceRecord


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'status', 'check_in_time', 'check_out_time', 'work_hours', 'admin_override']
    list_filter = ['status', 'date', 'check_in_method', 'admin_override']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'check_in_similarity',
                       'check_out_similarity', 'check_in_confidence', 'check_out_confidence']
    ordering = ['-date']

    fieldsets = (
        ('Employee & Date', {'fields': ('id', 'user', 'date', 'status')}),
        ('Check-in', {'fields': ('check_in_time', 'check_in_method', 'check_in_similarity', 'check_in_confidence')}),
        ('Check-out', {'fields': ('check_out_time', 'check_out_method', 'check_out_similarity', 'check_out_confidence')}),
        ('Summary', {'fields': ('work_hours', 'admin_override', 'notes')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )
