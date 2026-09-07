from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth import get_user_model
from config.throttles import AuthRateThrottle

from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    ChangePasswordSerializer
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    
    POST /api/auth/register/
    {
        "email": "user@example.com",
        "password": "securepassword",
        "password_confirm": "securepassword",
        "role": "EMPLOYEE"  // Optional, defaults to EMPLOYEE
    }
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer
    throttle_classes = [AuthRateThrottle]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'message': 'User registered successfully.'
        }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def login_view(request):
    """
    API endpoint for user login.
    
    POST /api/auth/login/
    {
        "email": "user@example.com",
        "password": "securepassword"
    }
    
    Returns:
    {
        "user": {...},
        "tokens": {
            "access": "...",
            "refresh": "..."
        }
    }
    """
    serializer = LoginSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    
    user = serializer.validated_data['user']
    
    # Refresh user from database to ensure we have the ID
    user = User.objects.get(email=user.email)
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': UserSerializer(user).data,
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        },
        'message': 'Login successful.'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    """
    API endpoint to get current authenticated user.
    
    GET /api/auth/me/
    
    Returns:
    {
        "id": "...",
        "email": "user@example.com",
        "role": "EMPLOYEE",
        "is_active": true,
        "date_joined": "2024-01-01T00:00:00Z"
    }
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    API endpoint for user logout.
    Blacklists the refresh token.
    
    POST /api/auth/logout/
    {
        "refresh": "..."
    }
    """
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({
            'message': 'Logout successful.'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': 'Invalid token.'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    API endpoint for changing user password.
    
    POST /api/auth/change-password/
    {
        "old_password": "...",
        "new_password": "...",
        "new_password_confirm": "..."
    }
    """
    serializer = ChangePasswordSerializer(
        data=request.data,
        context={'request': request}
    )
    serializer.is_valid(raise_exception=True)
    
    # Change password
    user = request.user
    user.set_password(serializer.validated_data['new_password'])
    user.save()
    
    return Response({
        'message': 'Password changed successfully.'
    }, status=status.HTTP_200_OK)


class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom token refresh view with additional response data.
    
    POST /api/auth/refresh/
    {
        "refresh": "..."
    }
    
    Returns:
    {
        "access": "...",
        "refresh": "..."  // Optional, if rotation is enabled
    }
    """
    pass
