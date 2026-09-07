/**
 * services/auth.test.ts
 * =====================
 * Integration-style tests for the auth service layer.
 * All network calls are intercepted with vi.fn() — no real server needed.
 *
 * Covers Phase 26 requirements:
 *   Register / Login / Logout / Refresh
 *   Invalid credentials / Expired token / Role distinctions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authService } from './auth';
import type { LoginResponse, RegisterResponse, AuthUser, AuthTokens } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────

const EMPLOYEE_USER: AuthUser = {
  id: 'emp001',
  email: 'alice@example.com',
  role: 'EMPLOYEE',
  is_active: true,
};

const ADMIN_USER: AuthUser = {
  id: 'adm001',
  email: 'admin@example.com',
  role: 'ADMIN',
  is_active: true,
};

const TOKENS: AuthTokens = {
  access: 'access.token.value',
  refresh: 'refresh.token.value',
};

/** Build a Response-like object that fetch will return. */
function mockFetchResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    statusText: status === 200 ? 'OK' : 'Error',
  } as Response);
}

// ── Setup / teardown ─────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

// ── register ─────────────────────────────────────────────────────────

describe('authService.register', () => {
  it('stores tokens and user in localStorage on success', async () => {
    const payload: RegisterResponse = {
      user: EMPLOYEE_USER,
      tokens: TOKENS,
      message: 'Registered.',
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    await authService.register({
      email: 'alice@example.com',
      password: 'Pass1234!',
      password_confirm: 'Pass1234!',
    });

    expect(localStorage.getItem('access_token')).toBe(TOKENS.access);
    expect(localStorage.getItem('refresh_token')).toBe(TOKENS.refresh);
    const stored = JSON.parse(localStorage.getItem('user') ?? 'null');
    expect(stored?.email).toBe('alice@example.com');
    expect(stored?.role).toBe('EMPLOYEE');
  });

  it('returns the full response including user and tokens', async () => {
    const payload: RegisterResponse = {
      user: EMPLOYEE_USER,
      tokens: TOKENS,
      message: 'Registered.',
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    const result = await authService.register({
      email: 'alice@example.com',
      password: 'Pass1234!',
      password_confirm: 'Pass1234!',
    });

    expect(result.user.id).toBe('emp001');
    expect(result.tokens.access).toBe(TOKENS.access);
  });

  it('throws on 400 Bad Request (duplicate email)', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      mockFetchResponse({ message: 'Email already exists.' }, 400),
    );

    await expect(
      authService.register({
        email: 'alice@example.com',
        password: 'Pass1234!',
        password_confirm: 'Pass1234!',
      }),
    ).rejects.toThrow();
  });

  it('does NOT store biometric data or embeddings in localStorage', async () => {
    const payload: RegisterResponse = {
      user: EMPLOYEE_USER,
      tokens: TOKENS,
      message: 'Registered.',
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    await authService.register({
      email: 'alice@example.com',
      password: 'Pass1234!',
      password_confirm: 'Pass1234!',
    });

    // Confirm no embedding-related keys are written
    const allKeys = Object.keys(localStorage);
    const forbiddenKeys = allKeys.filter(k =>
      k.includes('embedding') || k.includes('biometric') || k.includes('face_vector'),
    );
    expect(forbiddenKeys).toHaveLength(0);
  });
});

// ── login ─────────────────────────────────────────────────────────────

describe('authService.login', () => {
  it('stores tokens and user on successful login', async () => {
    const payload: LoginResponse = {
      user: EMPLOYEE_USER,
      tokens: TOKENS,
      message: 'Login successful.',
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    await authService.login({ email: 'alice@example.com', password: 'Pass1234!' });

    expect(localStorage.getItem('access_token')).toBe(TOKENS.access);
    expect(localStorage.getItem('refresh_token')).toBe(TOKENS.refresh);
  });

  it('returns ADMIN role correctly', async () => {
    const payload: LoginResponse = {
      user: ADMIN_USER,
      tokens: TOKENS,
      message: 'Login successful.',
    };
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(mockFetchResponse(payload));

    const result = await authService.login({
      email: 'admin@example.com',
      password: 'Admin1234!',
    });

    expect(result.user.role).toBe('ADMIN');
  });

  it('throws on invalid credentials (400)', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      mockFetchResponse({ message: 'Invalid credentials.' }, 400),
    );

    await expect(
      authService.login({ email: 'nobody@example.com', password: 'wrong' }),
    ).rejects.toThrow();
  });

  it('does not store tokens on failed login', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      mockFetchResponse({ message: 'Invalid credentials.' }, 400),
    );

    try {
      await authService.login({ email: 'bad@example.com', password: 'wrong' });
    } catch {
      // expected
    }

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});

// ── logout ────────────────────────────────────────────────────────────

describe('authService.logout', () => {
  beforeEach(() => {
    localStorage.setItem('access_token',  TOKENS.access);
    localStorage.setItem('refresh_token', TOKENS.refresh);
    localStorage.setItem('user', JSON.stringify(EMPLOYEE_USER));
  });

  it('clears all auth tokens from localStorage', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      mockFetchResponse({ message: 'Logged out.' }),
    );

    await authService.logout();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('still clears localStorage even if the API call fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    await authService.logout();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('clears localStorage even on a 401 from the server', async () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      mockFetchResponse({ detail: 'Token already blacklisted.' }, 401),
    );

    await authService.logout();

    expect(localStorage.getItem('access_token')).toBeNull();
  });
});

// ── refreshToken ──────────────────────────────────────────────────────

describe('authService.refreshToken', () => {
  it('stores and returns the new access token', async () => {
    localStorage.setItem('refresh_token', TOKENS.refresh);
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      mockFetchResponse({ access: 'new.access.token' }),
    );

    const result = await authService.refreshToken();

    expect(result.access).toBe('new.access.token');
    expect(localStorage.getItem('access_token')).toBe('new.access.token');
  });

  it('throws when no refresh token is stored', async () => {
    localStorage.removeItem('refresh_token');

    await expect(authService.refreshToken()).rejects.toThrow(
      'No refresh token available',
    );
  });
});

// ── sync helpers ──────────────────────────────────────────────────────

describe('authService sync helpers', () => {
  it('isAuthenticated returns false when no token is stored', () => {
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('isAuthenticated returns true when access token is stored', () => {
    localStorage.setItem('access_token', 'some.token');
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('getStoredUser returns null when nothing is stored', () => {
    expect(authService.getStoredUser()).toBeNull();
  });

  it('getStoredUser returns parsed user when one is stored', () => {
    localStorage.setItem('user', JSON.stringify(EMPLOYEE_USER));
    const u = authService.getStoredUser();
    expect(u?.email).toBe('alice@example.com');
    expect(u?.role).toBe('EMPLOYEE');
  });

  it('getStoredUser returns null on malformed JSON', () => {
    localStorage.setItem('user', '{bad json');
    expect(authService.getStoredUser()).toBeNull();
  });

  it('getAccessToken returns the stored token', () => {
    localStorage.setItem('access_token', 'tok');
    expect(authService.getAccessToken()).toBe('tok');
  });
});
