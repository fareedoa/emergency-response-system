import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, clearAuth } from '../api';

const Ctx = createContext(null);

// ── Preview mode mock user ────────────────────────────────────────────────
// When the backend is not running, this user is injected automatically so
// you can navigate all pages. Remove PREVIEW_MODE = true when backend is up.
const PREVIEW_MODE = true;
const MOCK_USER = {
  id: 'preview-user-001',
  name: 'Vanessa Ayertey',
  email: 'admin@emergency.gov.gh',
  role: 'SYSTEM_ADMIN',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (PREVIEW_MODE) return MOCK_USER;
    try { return JSON.parse(localStorage.getItem('swiftaid_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    if (PREVIEW_MODE) { setLoading(false); return; }
    if (!localStorage.getItem('swiftaid_access')) { setLoading(false); return; }
    try {
      const { data } = await authApi.profile();
      setUser(data);
      localStorage.setItem('swiftaid_user', JSON.stringify(data));
    } catch {
      clearAuth(); setUser(null);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!PREVIEW_MODE && !user) loadProfile(); }, []);

  const login = async (email, password) => {
    if (PREVIEW_MODE) { setUser(MOCK_USER); return MOCK_USER; }
    const { data } = await authApi.login(email, password);
    localStorage.setItem('swiftaid_access', data.accessToken);
    localStorage.setItem('swiftaid_refresh', data.refreshToken);
    const profile = { id: data.userId, name: data.name, email: data.email, role: data.role };
    setUser(profile);
    localStorage.setItem('swiftaid_user', JSON.stringify(profile));
    return profile;
  };

  const register = async (name, email, password) => {
    if (PREVIEW_MODE) { setUser(MOCK_USER); return MOCK_USER; }
    const { data } = await authApi.register({ name, email, password });
    localStorage.setItem('swiftaid_access', data.accessToken);
    localStorage.setItem('swiftaid_refresh', data.refreshToken);
    const profile = { id: data.userId, name: data.name, email: data.email, role: data.role };
    setUser(profile);
    localStorage.setItem('swiftaid_user', JSON.stringify(profile));
    return profile;
  };

  const logout = async () => {
    if (PREVIEW_MODE) { return; }
    try { await authApi.logout(); } catch {}
    clearAuth(); setUser(null);
  };

  const is = (...roles) => roles.includes(user?.role);

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, is, isAdmin: () => is('SYSTEM_ADMIN') }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
