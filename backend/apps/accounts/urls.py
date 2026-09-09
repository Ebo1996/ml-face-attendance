from django.urls import path
from .views import (
    RegisterView,
    login_view,
    current_user_view,
    logout_view,
    change_password_view,
    CustomTokenRefreshView,
)
from .google_auth import google_auth

urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', login_view, name='login'),
    path('google/', google_auth, name='google-auth'),  # Google OAuth
    path('logout/', logout_view, name='logout'),
    path('me/', current_user_view, name='current-user'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='token-refresh'),
    path('change-password/', change_password_view, name='change-password'),
]
