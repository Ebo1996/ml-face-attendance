"""
Employee Management Views
"""

from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Q

from apps.accounts.permissions import IsAdmin, IsOwnerOrAdmin
from .models import EmployeeProfile
from .serializers import (
    EmployeeDetailSerializer,
    EmployeeListSerializer,
    EmployeeUpdateSerializer,
    ProfileUpdateSerializer,
)

User = get_user_model()


class EmployeeListView(generics.ListAPIView):
    """
    List all employees with search and filtering.
    Admin only.
    
    GET /api/employees/
    Query params:
    - search: Search by name, email, employee_id
    - role: Filter by role (ADMIN, EMPLOYEE)
    - department: Filter by department
    - is_active: Filter by active status (true, false)
    """
    serializer_class = EmployeeListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def get_queryset(self):
        queryset = User.objects.select_related('employee_profile').all()
        
        # Search
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(employee_profile__first_name__icontains=search) |
                Q(employee_profile__last_name__icontains=search) |
                Q(employee_profile__employee_id__icontains=search)
            )
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role.upper())
        
        # Filter by department
        department = self.request.query_params.get('department', None)
        if department:
            queryset = queryset.filter(employee_profile__department__icontains=department)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
        
        return queryset.order_by('-date_joined')


class EmployeeDetailView(generics.RetrieveAPIView):
    """
    Get employee details.
    Admin can view any employee, users can view their own profile.
    
    GET /api/employees/<id>/
    """
    serializer_class = EmployeeDetailSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    queryset = User.objects.select_related('employee_profile').all()


class EmployeeUpdateView(generics.UpdateAPIView):
    """
    Update employee information.
    Admin only.
    
    PUT/PATCH /api/employees/<id>/
    """
    serializer_class = EmployeeUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = User.objects.all()
    
    def get_serializer_context(self):
        """Add user to serializer context for validation."""
        context = super().get_serializer_context()
        context['user'] = self.get_object()
        return context
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Return updated employee details
        output_serializer = EmployeeDetailSerializer(instance)
        return Response(output_serializer.data)


class EmployeeDeleteView(generics.DestroyAPIView):
    """
    Delete employee (soft delete - set inactive).
    Admin only.
    
    DELETE /api/employees/<id>/
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = User.objects.all()
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Prevent deleting yourself
        if instance.id == request.user.id:
            return Response(
                {'error': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Soft delete - just deactivate
        instance.is_active = False
        instance.save()
        
        return Response(
            {'message': 'Employee deactivated successfully.'},
            status=status.HTTP_200_OK
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_own_profile(request):
    """
    Update own profile.
    Any authenticated user can update their own profile.
    
    PATCH /api/employees/profile/
    """
    serializer = ProfileUpdateSerializer(
        request.user,
        data=request.data,
        partial=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()
    
    # Return updated profile
    output_serializer = EmployeeDetailSerializer(request.user)
    return Response(output_serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    """
    Upload avatar for own profile.
    
    POST /api/employees/avatar/
    Form data:
    - avatar: Image file
    """
    if 'avatar' not in request.FILES:
        return Response(
            {'error': 'No avatar file provided.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    avatar_file = request.FILES['avatar']
    
    # Validate file size (max 2MB)
    if avatar_file.size > 2 * 1024 * 1024:
        return Response(
            {'error': 'Avatar file size must be less than 2MB.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/gif']
    if avatar_file.content_type not in allowed_types:
        return Response(
            {'error': 'Avatar must be a JPEG, PNG, or GIF image.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get or create profile
    profile, created = EmployeeProfile.objects.get_or_create(user=request.user)
    
    # Delete old avatar if exists
    if profile.avatar:
        profile.avatar.delete(save=False)
    
    # Save new avatar
    profile.avatar = avatar_file
    profile.save()
    
    return Response({
        'message': 'Avatar uploaded successfully.',
        'avatar_url': request.build_absolute_uri(profile.avatar.url) if profile.avatar else None
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def employee_stats(request):
    """
    Get employee statistics.
    Admin only.
    
    GET /api/employees/stats/
    """
    total_employees = User.objects.count()
    active_employees = User.objects.filter(is_active=True).count()
    inactive_employees = User.objects.filter(is_active=False).count()
    admin_count = User.objects.filter(role='ADMIN').count()
    employee_count = User.objects.filter(role='EMPLOYEE').count()
    
    # Department breakdown
    departments = EmployeeProfile.objects.exclude(
        department=''
    ).values_list('department', flat=True).distinct()
    
    department_stats = []
    for dept in departments:
        count = EmployeeProfile.objects.filter(department=dept).count()
        department_stats.append({
            'department': dept,
            'count': count
        })
    
    return Response({
        'total_employees': total_employees,
        'active_employees': active_employees,
        'inactive_employees': inactive_employees,
        'admin_count': admin_count,
        'employee_count': employee_count,
        'departments': department_stats,
    })
