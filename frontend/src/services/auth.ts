/**
 * services/auth.ts
 * ================
 * Authentication API service — login, register, logout, token refresh.
 *
 * All types are imported from types/index.ts (single source of truth).
 * Named re-exports below keep every existing consumer import working
 * without modification.
 */

import { apiClient } from './api';
import type {
  AuthUser,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UserRole,
} from '../types';

// ── Backwards-compat re-exports ───────────────────────────────────────
// Components that import `User`, `UserRole`, `LoginRequest`, etc. from
// this file continue to work without any change.

export type { UserRole };
export type { AuthTokens };
export type { LoginRequest,  RegisterRequest };
export type { LoginResponse, RegisterResponse };
export type { ChangePasswordRequest, ChangePasswordResponse };

/** @deprecated Use AuthUser from types/. Kept for existing imports. */
export type User = AuthUser;

// ── Auth service ──────────────────────────────────────────────────────

export const authService = {
  /**
   * Register a new user account.
   * Stores access + refresh tokens in localStorage.
   * Biometric data is never touched here.
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/auth/register/', data);
    if (response.tokens) {
      localStorage.setItem('access_token',  response.tokens.access);
      localStorage.setItem('refresh_token', response.tokens.refresh);
      localStorage.setItem('user',          JSON.stringify(response.user));
    }
    return response;
  },

  /** Authenticate with email + password. Returns JWT tokens. */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login/', data);
    if (response.tokens) {
      localStorage.setItem('access_token',  response.tokens.access);
      localStorage.setItem('refresh_token', response.tokens.refresh);
      localStorage.setItem('user',          JSON.stringify(response.user));
    }
    return response;
  },

  /** Blacklist refresh token server-side, then clear localStorage. */
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch {
      // Logout API call failed — clear tokens anyway
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  /** Fetch the authenticated user's profile from /api/auth/me/. */
  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>('/auth/me/');
    localStorage.setItem('user', JSON.stringify(response));
    return response;
  },

  /** Exchange refresh token for a new access token. */
  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await apiClient.post<{ access: string }>('/auth/refresh/', {
      refresh: refreshToken,
    });
    localStorage.setItem('access_token', response.access);
    return { access: response.access, refresh: refreshToken };
  },

  /** Change authenticated user's password. */
  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    return apiClient.post<ChangePasswordResponse>('/auth/change-password/', data);
  },

  // ── Sync helpers (no network) ───────────────────────────────────────

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  getStoredUser(): AuthUser | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try { return JSON.parse(raw) as AuthUser; } catch { return null; }
  },

  getAccessToken():  string | null { return localStorage.getItem('access_token');  },
  getRefreshToken(): string | null { return localStorage.getItem('refresh_token'); },
};
