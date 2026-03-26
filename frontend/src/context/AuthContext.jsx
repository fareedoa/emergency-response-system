import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, clearAuth } from '../api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('swiftaid_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(!!localStorage.getItem('swiftaid_access'));

  const loadProfile = useCallback(async () => {
    if (!localStorage.getItem('swiftaid_access')) { setLoading(false); return; }
    try {
      const { data } = await authApi.profile();
      // UserProfileResponse: { userId, name, email, role, createdDate, updatedAt, lastLogin }
      const profile = { id: data.userId, name: data.name, email: data.email, role: data.role };
      setUser(profile);
      localStorage.setItem('swiftaid_user', JSON.stringify(profile));
    } catch {
      clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user && localStorage.getItem('swiftaid_access')) {
      loadProfile();
    } else {
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
