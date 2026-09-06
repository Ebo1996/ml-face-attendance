"""
Employee Admin Configuration
"""

from django.contrib import admin
from .models import EmployeeProfile


@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    """Admin interface for employee profiles."""
    
    list_display = (
        'user',
        'full_name',
        'department',
        'position',
        'employee_id',
        'created_at',
    )
    
    list_filter = (
        'department',
        'position',
        'created_at',
    )
    
    search_fields = (
        'user__email',
        'first_name',
        'last_name',
        'employee_id',
        'department',
        'position',
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'phone')
        }),
        ('Work Information', {
            'fields': ('department', 'position', 'employee_id')
        }),
        ('Avatar', {
            'fields': ('avatar',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
