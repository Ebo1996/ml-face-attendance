"""
Tests for accounts app — User model, serializers, and auth endpoints.
Run: python manage.py test apps.accounts
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User
from .serializers import RegisterSerializer, LoginSerializer


# ── Model tests ────────────────────────────────────────────────────────────────

class UserModelTests(TestCase):
    """Test custom User model behaviour."""

    def test_create_user(self):
        user = User.objects.create_user(email='alice@example.com', password='Pass1234!')
        self.assertEqual(user.email, 'alice@example.com')
        self.assertEqual(user.role, 'EMPLOYEE')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)

    def test_create_user_without_email_raises(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', password='Pass1234!')

    def test_create_superuser(self):
        su = User.objects.create_superuser(email='admin@example.com', password='Admin1234!')
        self.assertTrue(su.is_staff)
        self.assertTrue(su.is_superuser)

    def test_user_str(self):
        user = User.objects.create_user(email='bob@example.com', password='Pass1234!')
        self.assertEqual(str(user), 'bob@example.com')

    def test_email_is_normalised(self):
        """Email domain should be lower-cased on creation."""
        user = User.objects.create_user(email='Carol@EXAMPLE.COM', password='Pass1234!')
        self.assertEqual(user.email, 'carol@example.com')

    def test_password_hashed(self):
        user = User.objects.create_user(email='dave@example.com', password='Pass1234!')
        self.assertNotEqual(user.password, 'Pass1234!')
        self.assertTrue(user.check_password('Pass1234!'))

    def test_admin_role(self):
        user = User.objects.create_user(
            email='mgr@example.com', password='Pass1234!', role='ADMIN'
        )
        self.assertEqual(user.role, 'ADMIN')

    def test_id_auto_generated(self):
        user = User.objects.create_user(email='eve@example.com', password='Pass1234!')
        self.assertIsNotNone(user.id)
        self.assertGreater(len(user.id), 0)


# ── Serializer tests ───────────────────────────────────────────────────────────

class RegisterSerializerTests(TestCase):

    def _valid_data(self, email='test@example.com'):
        return {
            'email': email,
            'password': 'SecurePass1234!',
            'password_confirm': 'SecurePass1234!',
            'role': 'EMPLOYEE',
        }

    def test_valid_registration(self):
        s = RegisterSerializer(data=self._valid_data())
        self.assertTrue(s.is_valid(), s.errors)
        user = s.save()
        self.assertEqual(user.email, 'test@example.com')

    def test_password_mismatch(self):
        data = self._valid_data()
        data['password_confirm'] = 'DifferentPass!'
        s = RegisterSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn('password_confirm', s.errors or s.errors.get('non_fields_errors', {}))

    def test_missing_email(self):
        data = self._valid_data()
        del data['email']
        s = RegisterSerializer(data=data)
        self.assertFalse(s.is_valid())
        self.assertIn('email', s.errors)

    def test_weak_password_rejected(self):
        data = self._valid_data()
        data['password'] = '123'
        data['password_confirm'] = '123'
        s = RegisterSerializer(data=data)
        self.assertFalse(s.is_valid())


# ── Auth endpoint tests ────────────────────────────────────────────────────────

class AuthEndpointTests(APITestCase):
    """Integration tests for /api/auth/* endpoints."""

    REGISTER_URL = '/api/auth/register/'
    LOGIN_URL    = '/api/auth/login/'
    ME_URL       = '/api/auth/me/'
    REFRESH_URL  = '/api/auth/refresh/'

    def _register(self, email='user@example.com', password='TestPass1234!'):
        return self.client.post(self.REGISTER_URL, {
            'email': email,
            'password': password,
            'password_confirm': password,
            'role': 'EMPLOYEE',
        }, format='json')

    # ── Register ─────────────────────────────────────────────────────

    def test_register_success(self):
        resp = self._register()
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', resp.data)
        self.assertIn('user', resp.data)
        self.assertEqual(resp.data['user']['email'], 'user@example.com')

    def test_register_duplicate_email(self):
        self._register()
        resp = self._register()  # same email
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_password_mismatch(self):
        resp = self.client.post(self.REGISTER_URL, {
            'email': 'x@example.com',
            'password': 'TestPass1234!',
            'password_confirm': 'WrongPass5678!',
            'role': 'EMPLOYEE',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_invalid_email(self):
        resp = self.client.post(self.REGISTER_URL, {
            'email': 'not-an-email',
            'password': 'TestPass1234!',
            'password_confirm': 'TestPass1234!',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # ── Login ─────────────────────────────────────────────────────────

    def test_login_success(self):
        self._register(email='login@example.com', password='TestPass1234!')
        resp = self.client.post(self.LOGIN_URL, {
            'email': 'login@example.com',
            'password': 'TestPass1234!',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', resp.data)
        self.assertIn('access', resp.data['tokens'])
        self.assertIn('refresh', resp.data['tokens'])

    def test_login_wrong_password(self):
        self._register(email='login2@example.com', password='TestPass1234!')
        resp = self.client.post(self.LOGIN_URL, {
            'email': 'login2@example.com',
            'password': 'WrongPassword!',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_nonexistent_user(self):
        resp = self.client.post(self.LOGIN_URL, {
            'email': 'nobody@example.com',
            'password': 'AnyPass1234!',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # ── /me ───────────────────────────────────────────────────────────

    def test_me_authenticated(self):
        reg = self._register(email='me@example.com', password='TestPass1234!')
        token = reg.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = self.client.get(self.ME_URL)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['email'], 'me@example.com')

    def test_me_unauthenticated(self):
        resp = self.client.get(self.ME_URL)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_invalid_token(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid.token.here')
        resp = self.client.get(self.ME_URL)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── Token refresh ─────────────────────────────────────────────────

    def test_token_refresh(self):
        reg = self._register(email='refresh@example.com', password='TestPass1234!')
        refresh_token = reg.data['tokens']['refresh']
        resp = self.client.post(self.REFRESH_URL, {'refresh': refresh_token}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('access', resp.data)

    def test_token_refresh_invalid(self):
        resp = self.client.post(self.REFRESH_URL, {'refresh': 'not.a.real.token'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
