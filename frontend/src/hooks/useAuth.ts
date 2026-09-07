/**
 * useAuth
 *
 * Re-export of the AuthContext hook for convenience.
 * Importing from here keeps the API consistent with the hooks pattern.
 *
 * Usage
 * -----
 *   import { useAuth } from '../hooks/useAuth';
 *   const { user, login, logout, isAuthenticated } = useAuth();
 */

export { useAuth } from '../contexts/AuthContext';
