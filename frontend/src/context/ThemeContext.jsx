/**
 * SwiftAid ThemeContext
 * Provides dark | light | high-contrast themes.
 * Persists to localStorage. Applies data-theme on <html>.
 * Injects no-flash <style> via useEffect before first paint.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const THEMES = ['dark', 'light', 'high-contrast'];
const STORAGE_KEY = 'swiftaid_theme';
const DEFAULT_THEME = 'dark';

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return THEMES.includes(saved) ? saved : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  const applyTheme = useCallback((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  // Apply on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const setTheme = useCallback((t) => {
    if (!THEMES.includes(t)) return;
    setThemeState(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
    applyTheme(t);
  }, [applyTheme]);

  const cycleTheme = useCallback(() => {
    setTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]);
  }, [theme, setTheme]);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme, cycleTheme, themes: THEMES }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};
