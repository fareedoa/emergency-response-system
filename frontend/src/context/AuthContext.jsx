import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, clearAuth } from '../api';

const Ctx = createContext(null);

// Decode JWT payload and check expiry without a network call
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('swiftaid_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(!!localStorage.getItem('swiftaid_access'));

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('swiftaid_access');
    if (!token) { setLoading(false); return; }

    // Fast-path: token is already expired — clear immediately, no network call
    if (isTokenExpired(token)) {
      clearAuth();
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await authApi.profile();
      const profile = { id: data.userId, name: data.name, email: data.email, role: data.role };
      setUser(profile);
      localStorage.setItem('swiftaid_user', JSON.stringify(profile));
    } catch (err) {
      if (err.response) {
        // Server rejected the token — clear session
        clearAuth();
        setUser(null);
      }
      // Network error (backend temporarily down) — keep cached session,
      // API interceptor will handle 401s on subsequent requests
    } finally {
      setLoading(false);
    }
  }, []);

  // Always validate the token on startup — never trust the localStorage cache alone
  useEffect(() => {
    if (localStorage.getItem('swiftaid_access')) {
      loadProfile();
    } else {
      clearAuth();   // clean up any stale user data without a token
      setUser(null);
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await authApi.login(email, password);
    // AuthResponse: { accessToken, refreshToken, userId, name, email, role }
    localStorage.setItem('swiftaid_access', data.accessToken);
    localStorage.setItem('swiftaid_refresh', data.refreshToken);
    const profile = { id: data.userId, name: data.name, email: data.email, role: data.role };
    setUser(profile);
    localStorage.setItem('swiftaid_user', JSON.stringify(profile));
    return profile;
  };

  const register = async (name, email, password, role) => {
    const { data } = await authApi.register({ name, email, password, role });
    localStorage.setItem('swiftaid_access', data.accessToken);
    localStorage.setItem('swiftaid_refresh', data.refreshToken);
    const profile = { id: data.userId, name: data.name, email: data.email, role: data.role };
    setUser(profile);
    localStorage.setItem('swiftaid_user', JSON.stringify(profile));
    return profile;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    setUser(null);
  };

  // Role helpers
  const is = (...roles) => roles.includes(user?.role);
  const isAdmin = () => is('SYSTEM_ADMIN');

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, is, isAdmin }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
