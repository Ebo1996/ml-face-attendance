"""
Attendance Models
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

User = get_user_model()


def generate_id():
    return uuid.uuid4().hex[:24]


class AttendanceRecord(models.Model):
    """
    A single attendance day-record per employee.

    One record per user per calendar date.
    Check-out is nullable (filled when employee clocks out).
    """

    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('LATE', 'Late'),
        ('HALF_DAY', 'Half Day'),
        ('ABSENT', 'Absent'),
        ('ON_LEAVE', 'On Leave'),
    ]

    METHOD_CHOICES = [
        ('FACE_RECOGNITION', 'Face Recognition'),
        ('MANUAL_ADMIN', 'Manual by Admin'),
        ('SYSTEM', 'System Generated'),
    ]

    id = models.CharField(max_length=24, primary_key=True, default=generate_id, editable=False)

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='attendance_records',
    )

    date = models.DateField(help_text="Attendance date (one record per user per date)")

    # ── Check-in ─────────────────────────────────────────────────────
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_in_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='FACE_RECOGNITION')
    check_in_similarity = models.FloatField(
        null=True, blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Face recognition similarity score at check-in",
    )
    check_in_confidence = models.CharField(max_length=10, blank=True, default='')

    # ── Check-out ────────────────────────────────────────────────────
    check_out_time = models.DateTimeField(null=True, blank=True)
    check_out_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='FACE_RECOGNITION')
    check_out_similarity = models.FloatField(
        null=True, blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
    )
    check_out_confidence = models.CharField(max_length=10, blank=True, default='')

    # ── Derived ──────────────────────────────────────────────────────
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PRESENT')
    work_hours = models.FloatField(
        null=True, blank=True,
        help_text="Total work hours (set when employee checks out)",
    )

    # ── Notes ────────────────────────────────────────────────────────
    notes = models.TextField(blank=True, default='')
    admin_override = models.BooleanField(default=False, help_text="Set by admin manually")

    # ── Timestamps ───────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'attendance'
        db_table = 'attendance_records'
        unique_together = [('user', 'date')]
        ordering = ['-date', '-check_in_time']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['date']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.user.email} — {self.date} [{self.status}]"

    @property
    def is_checked_in(self):
        return self.check_in_time is not None

    @property
    def is_checked_out(self):
        return self.check_out_time is not None

    def compute_work_hours(self):
        """Return hours between check-in and check-out, or None."""
        if self.check_in_time and self.check_out_time:
            delta = self.check_out_time - self.check_in_time
            return round(delta.total_seconds() / 3600, 2)
        return None
