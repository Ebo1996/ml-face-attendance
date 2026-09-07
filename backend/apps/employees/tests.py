"""
Tests for employees app — EmployeeProfile model, serializers, and endpoints.
Run: python manage.py test apps.employees
"""

from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from .models import EmployeeProfile
from .serializers import EmployeeListSerializer, EmployeeUpdateSerializer

User = get_user_model()


# ── Helpers ─────────────────────────────────────────────────────────────────

def make_user(email='emp@example.com', password='TestPass1234!', role='EMPLOYEE'):
    return User.objects.create_user(email=email, password=password, role=role)


def make_admin(email='admin@example.com', password='AdminPass1234!'):
    return make_user(email=email, password=password, role='ADMIN')


# ── EmployeeProfile model ────────────────────────────────────────────────────

class EmployeeProfileModelTests(APITestCase):

    def setUp(self):
        self.user = make_user()

    def test_profile_created_on_demand(self):
        profile, created = EmployeeProfile.objects.get_or_create(user=self.user)
        self.assertIsNotNone(profile)
        self.assertTrue(created)

    def test_get_full_name_with_both_names(self):
        profile, _ = EmployeeProfile.objects.get_or_create(user=self.user)
        profile.first_name = 'Alice'
        profile.last_name = 'Smith'
        profile.save()
        self.assertEqual(profile.get_full_name(), 'Alice Smith')

    def test_get_full_name_first_only(self):
        profile, _ = EmployeeProfile.objects.get_or_create(user=self.user)
        profile.first_name = 'Alice'
        profile.last_name = ''
        profile.save()
        self.assertEqual(profile.get_full_name(), 'Alice')

    def test_get_full_name_fallback_to_email(self):
        profile, _ = EmployeeProfile.objects.get_or_create(user=self.user)
        profile.first_name = ''
        profile.last_name = ''
        profile.save()
        self.assertEqual(profile.get_full_name(), self.user.email)

    def test_full_name_property(self):
        profile, _ = EmployeeProfile.objects.get_or_create(user=self.user)
        profile.first_name = 'Bob'
        profile.last_name = 'Jones'
        profile.save()
        self.assertEqual(profile.full_name, 'Bob Jones')

    def test_str(self):
        profile, _ = EmployeeProfile.objects.get_or_create(user=self.user)
        profile.first_name = 'Carol'
        profile.last_name = 'White'
        profile.save()
        self.assertIn('Carol White', str(profile))
        self.assertIn(self.user.email, str(profile))


# ── Employee list endpoint ───────────────────────────────────────────────────

class EmployeeListEndpointTests(APITestCase):

    LIST_URL = '/api/employees/'
    STATS_URL = '/api/employees/stats/'

    def setUp(self):
        self.admin = make_admin()
        self.employee = make_user('worker@example.com')
        reg = self.client.post('/api/auth/register/', {
            'email': 'admin2@example.com',
            'password': 'AdminPass1234!',
            'password_confirm': 'AdminPass1234!',
            'role': 'ADMIN',
        }, format='json')
        token = reg.data.get('tokens', {}).get('access')
        if not token:
            login = self.client.post('/api/auth/login/', {
                'email': 'admin@example.com',
                'password': 'AdminPass1234!',
            }, format='json')
            token = login.data['tokens']['access']
        self.admin_token = token

    def _auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def _admin_login(self):
        resp = self.client.post('/api/auth/login/', {
            'email': 'admin@example.com',
            'password': 'AdminPass1234!',
        }, format='json')
        return resp.data['tokens']['access']

    def test_list_requires_auth(self):
        resp = self.client.get(self.LIST_URL)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_requires_admin(self):
        # Employee role should get 403
        reg = self.client.post('/api/auth/register/', {
            'email': 'reg_emp@example.com',
            'password': 'Pass1234!',
            'password_confirm': 'Pass1234!',
            'role': 'EMPLOYEE',
        }, format='json')
        token = reg.data['tokens']['access']
        self._auth(token)
        resp = self.client.get(self.LIST_URL)
        self.assertIn(resp.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

    def test_stats_requires_auth(self):
        resp = self.client.get(self.STATS_URL)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Profile update endpoint ──────────────────────────────────────────────────

class ProfileUpdateTests(APITestCase):

    PROFILE_URL = '/api/employees/profile/'

    def _register_and_auth(self, email='u@example.com'):
        resp = self.client.post('/api/auth/register/', {
            'email': email,
            'password': 'TestPass1234!',
            'password_confirm': 'TestPass1234!',
            'role': 'EMPLOYEE',
        }, format='json')
        token = resp.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return resp.data['user']

    def test_update_own_profile(self):
        self._register_and_auth('profile@example.com')
        resp = self.client.patch(self.PROFILE_URL, {
            'first_name': 'John',
            'last_name': 'Doe',
            'department': 'Engineering',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_update_profile_requires_auth(self):
        self.client.credentials()
        resp = self.client.patch(self.PROFILE_URL, {'first_name': 'X'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


# ── Serializer tests ─────────────────────────────────────────────────────────

class EmployeeListSerializerTests(APITestCase):

    def test_serializes_user_without_profile(self):
        user = make_user('nopr@example.com')
        data = EmployeeListSerializer(user).data
        self.assertEqual(data['email'], 'nopr@example.com')
        self.assertEqual(data['full_name'], 'nopr@example.com')  # fallback
        self.assertEqual(data['department'], '')
        self.assertEqual(data['position'], '')

    def test_serializes_user_with_profile(self):
        user = make_user('withpr@example.com')
        profile, _ = EmployeeProfile.objects.get_or_create(user=user)
        profile.first_name = 'Jane'
        profile.last_name = 'Doe'
        profile.department = 'HR'
        profile.position = 'Manager'
        profile.save()
        data = EmployeeListSerializer(user).data
        self.assertEqual(data['full_name'], 'Jane Doe')
        self.assertEqual(data['department'], 'HR')
        self.assertEqual(data['position'], 'Manager')
