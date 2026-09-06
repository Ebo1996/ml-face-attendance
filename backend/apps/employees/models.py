"""
Employee Profile Models
"""

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class EmployeeProfile(models.Model):
    """
    Extended profile information for employees.
    One-to-one relationship with User model.
    """
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='employee_profile',
        primary_key=True
    )
    
    # Personal Information
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Work Information
    department = models.CharField(max_length=100, blank=True)
    position = models.CharField(max_length=100, blank=True)
    employee_id = models.CharField(max_length=50, blank=True, unique=True, null=True)
    
    # Avatar
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'employee_profiles'
        verbose_name = 'Employee Profile'
        verbose_name_plural = 'Employee Profiles'
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.user.email})"
    
    def get_full_name(self):
        """Return full name or email if name not set."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        return self.user.email
    
    @property
    def full_name(self):
        """Property accessor for full name."""
        return self.get_full_name()
