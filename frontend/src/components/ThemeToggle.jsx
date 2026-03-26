import { Sun, Moon, Contrast } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const THEMES = [
  { key: 'dark',           Icon: Moon,     label: 'Dark' },
  { key: 'light',          Icon: Sun,      label: 'Light' },
  { key: 'high-contrast',  Icon: Contrast, label: 'High Contrast' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const idx     = THEMES.findIndex(t => t.key === theme);
  const current = THEMES[idx] ?? THEMES[0];
  const next    = THEMES[(idx + 1) % THEMES.length];
  const CurrentIcon = current.Icon;

  return (
    <button
      onClick={() => setTheme(next.key)}
      aria-label={`Switch to ${next.label} theme`}
      title={`Theme: ${current.label} — click for ${next.label}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px',
        borderRadius: 'var(--r-sm)',
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)',
        fontSize: 11, fontFamily: 'var(--font-mono)',
        letterSpacing: '0.06em', cursor: 'pointer',
        transition: 'all var(--ease-fast)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--color-brand)';
        e.currentTarget.style.color = 'var(--color-brand)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
      onKeyDown={e => e.key === 'Enter' && setTheme(next.key)}
    >
      <CurrentIcon size={14} strokeWidth={2} />
      <span className="hide-mobile">{current.label}</span>
    </button>
  );
}
