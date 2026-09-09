"""
Google OAuth Authentication Handler
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
import requests
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Authenticate or register user with Google OAuth credential
    
    POST /api/auth/google/
    Body: { "credential": "google_id_token" }
    
    Returns JWT tokens and user info
    """
    credential = request.data.get('credential')
    
    if not credential:
        return Response(
            {'error': 'Google credential is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Verify token with Google
        google_response = requests.get(
            'https://www.googleapis.com/oauth2/v3/tokeninfo',
            params={'id_token': credential},
            timeout=5
        )
        
        if google_response.status_code != 200:
            return Response(
                {'error': 'Invalid Google token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_data = google_response.json()
        
        # Extract user information
        email = user_data.get('email')
        given_name = user_data.get('given_name', '')
        family_name = user_data.get('family_name', '')
        picture = user_data.get('picture', '')
        
        if not email:
            return Response(
                {'error': 'Email not provided by Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if email is verified by Google
        if not user_data.get('email_verified'):
            return Response(
                {'error': 'Google email not verified'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'role': 'EMPLOYEE',  # Default role for OAuth users
                'is_active': True,
            }
        )
        
        # Create or update employee profile
        from apps.employees.models import EmployeeProfile
        
        profile, profile_created = EmployeeProfile.objects.get_or_create(
            user=user,
            defaults={
                'first_name': given_name,
                'last_name': family_name,
                'department': 'General',
                'position': 'Employee',
                'employee_id': f'EMP{str(user.id)[:8].upper()}',
            }
        )
        
        # Update profile if it exists but names are empty
        if not profile_created and (not profile.first_name or not profile.last_name):
            if given_name:
                profile.first_name = given_name
            if family_name:
                profile.last_name = family_name
            profile.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"Google OAuth: User {'created' if created else 'logged in'}: {email}")
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'role': user.role,
                'full_name': f"{given_name} {family_name}".strip() or email,
            },
            'is_new_user': created,
            'message': 'Account created successfully' if created else 'Login successful'
        }, status=status.HTTP_200_OK)
        
    except requests.RequestException as e:
        logger.error(f"Google OAuth error: {e}")
        return Response(
            {'error': 'Failed to verify Google token. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Google OAuth unexpected error: {e}", exc_info=True)
        return Response(
            {'error': 'Authentication failed. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
