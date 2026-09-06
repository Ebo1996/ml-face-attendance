"""
Employee Serializers
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import EmployeeProfile

User = get_user_model()


class EmployeeProfileSerializer(serializers.ModelSerializer):
    """Serializer for employee profile."""
    
    class Meta:
        model = EmployeeProfile
        fields = (
            'first_name',
            'last_name',
            'phone',
            'department',
            'position',
            'employee_id',
            'avatar',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for employee including user and profile data."""
    
    profile = EmployeeProfileSerializer(source='employee_profile', required=False)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'role',
            'is_active',
            'date_joined',
            'profile',
            'full_name',
        )
        read_only_fields = ('id', 'date_joined')
    
    def get_full_name(self, obj):
        """Get full name from profile or email."""
        if hasattr(obj, 'employee_profile'):
            return obj.employee_profile.get_full_name()
        return obj.email


class EmployeeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for employee list."""
    
    full_name = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    position = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'role',
            'is_active',
            'full_name',
            'department',
            'position',
        )
    
    def get_full_name(self, obj):
        """Get full name from profile or email."""
        if hasattr(obj, 'employee_profile'):
            return obj.employee_profile.get_full_name()
        return obj.email
    
    def get_department(self, obj):
        """Get department from profile."""
        if hasattr(obj, 'employee_profile'):
            return obj.employee_profile.department
        return ''
    
    def get_position(self, obj):
        """Get position from profile."""
        if hasattr(obj, 'employee_profile'):
            return obj.employee_profile.position
        return ''


class EmployeeUpdateSerializer(serializers.Serializer):
    """Serializer for updating employee information."""
    
    # User fields
    email = serializers.EmailField(required=False)
    role = serializers.ChoiceField(choices=['ADMIN', 'EMPLOYEE'], required=False)
    is_active = serializers.BooleanField(required=False)
    
    # Profile fields
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)
    position = serializers.CharField(max_length=100, required=False, allow_blank=True)
    employee_id = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    
    def validate_email(self, value):
        """Ensure email is unique if being changed."""
        user = self.context.get('user')
        if user and User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError('This email is already in use.')
        return value
    
    def validate_employee_id(self, value):
        """Ensure employee_id is unique if provided."""
        if not value:
            return None
        
        user = self.context.get('user')
        query = EmployeeProfile.objects.filter(employee_id=value)
        if user and hasattr(user, 'employee_profile'):
            query = query.exclude(user=user)
        
        if query.exists():
            raise serializers.ValidationError('This employee ID is already in use.')
        return value
    
    def update(self, instance, validated_data):
        """Update user and profile data."""
        # Update user fields
        if 'email' in validated_data:
            instance.email = validated_data['email']
        if 'role' in validated_data:
            instance.role = validated_data['role']
        if 'is_active' in validated_data:
            instance.is_active = validated_data['is_active']
        
        instance.save()
        
        # Update or create profile
        profile_data = {
            'first_name': validated_data.get('first_name', ''),
            'last_name': validated_data.get('last_name', ''),
            'phone': validated_data.get('phone', ''),
            'department': validated_data.get('department', ''),
            'position': validated_data.get('position', ''),
            'employee_id': validated_data.get('employee_id'),
        }
        
        # Remove None values
        profile_data = {k: v for k, v in profile_data.items() if v is not None}
        
        # Get or create profile
        profile, created = EmployeeProfile.objects.get_or_create(user=instance)
        
        # Update profile fields
        for field, value in profile_data.items():
            setattr(profile, field, value)
        
        profile.save()
        
        return instance


class ProfileUpdateSerializer(serializers.Serializer):
    """Serializer for users updating their own profile."""
    
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    def update(self, instance, validated_data):
        """Update profile data."""
        # Get or create profile
        profile, created = EmployeeProfile.objects.get_or_create(user=instance)
        
        # Update profile fields
        for field, value in validated_data.items():
            setattr(profile, field, value)
        
        profile.save()
        
        return instance
