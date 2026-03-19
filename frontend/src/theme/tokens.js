/**
 * SwiftAid Design System — Token Source of Truth
 * All CSS custom properties are derived from these values.
 * Import this file anywhere you need JS-side token access.
 */

// ── COLOUR TOKENS ─────────────────────────────────────────────────────────────

export const colors = {
  // Core backgrounds (dark theme)
  bgVoid:    '#080E1E',
  bgBase:    '#0C1328',
  bgSurface: '#101D38',
  bgRaised:  '#162546',
  bgOverlay: '#1C2F58',
  bgHover:   '#22396A',

  // Brand accent — Amber / Ghana Gold
  amber:        '#F59E0B',
  amberBright:  '#FCD34D',
  amberDim:     '#B45309',
  amberSoft:    'rgba(245,158,11,0.14)',
  amberGlow:    'rgba(245,158,11,0.35)',
  amberBorder:  'rgba(245,158,11,0.22)',

  // Dispatch accent — Cyan
  cyan:       '#22D3EE',
  cyanSoft:   'rgba(34,211,238,0.12)',
  cyanGlow:   'rgba(34,211,238,0.3)',
  cyanBorder: 'rgba(34,211,238,0.2)',

  // Semantic — CRITICAL / danger
  danger:       '#EF4444',
  dangerSoft:   'rgba(239,68,68,0.12)',
  dangerBorder: 'rgba(239,68,68,0.22)',

  // Semantic — WARNING / in-progress
  warning:       '#F97316',
  warningSoft:   'rgba(249,115,22,0.12)',
  warningBorder: 'rgba(249,115,22,0.22)',

  // Semantic — RESOLVED / safe
  success:       '#22C55E',
  successSoft:   'rgba(34,197,94,0.12)',
  successBorder: 'rgba(34,197,94,0.22)',

  // Semantic — INFORMATION / neutral
  info:       '#38BDF8',
  infoSoft:   'rgba(56,189,248,0.12)',
  infoBorder: 'rgba(56,189,248,0.2)',

  // Misc / DISPATCHED distinct (violet-indigo)
  violet:       '#818CF8',
  violetSoft:   'rgba(129,140,248,0.12)',
  violetBorder: 'rgba(129,140,248,0.2)',

  // Neutral text
  textPrimary:   '#E2E8F7',
  textSecondary: '#7A93BF',
  textMuted:     '#3D5275',
  textBrand:     '#F59E0B',
  textDanger:    '#EF4444',
  textSuccess:   '#22C55E',

  // Borders
  borderFaint:  'rgba(255,255,255,0.04)',
  borderSubtle: 'rgba(255,255,255,0.08)',
  borderNormal: 'rgba(255,255,255,0.14)',
  borderStrong: 'rgba(255,255,255,0.22)',

  // On-brand (text on amber btn)
  onBrand: '#000000',
};

// ── TYPOGRAPHY ────────────────────────────────────────────────────────────────

export const typography = {
  fontDisplay: "'Space Grotesk', 'Sora', sans-serif",
  fontBody:    "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono:    "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, 'Courier New', monospace",

  // Scale
  xs:   '10px',
  sm:   '11px',
  base: '13px',
  md:   '14px',
  lg:   '16px',
  xl:   '20px',
  '2xl': '24px',
  '3xl': '30px',
  '4xl': '38px',
};

// ── SPACING ──────────────────────────────────────────────────────────────────

export const spacing = {
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  7:  '28px',
  8:  '32px',
  10: '40px',
  12: '48px',
  16: '64px',
};

// ── BORDER RADIUS ─────────────────────────────────────────────────────────────

export const borderRadius = {
  xs: '4px',
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
};

// ── SHADOWS ───────────────────────────────────────────────────────────────────

export const shadows = {
  sm:    '0 1px 4px rgba(0,0,0,0.5)',
  md:    '0 4px 20px rgba(0,0,0,0.6)',
  lg:    '0 8px 48px rgba(0,0,0,0.7)',
  xl:    '0 16px 64px rgba(0,0,0,0.8)',
  amber: '0 0 28px rgba(245,158,11,0.22)',
  cyan:  '0 0 24px rgba(34,211,238,0.18)',
  danger:'0 0 24px rgba(239,68,68,0.22)',
};

// ── Z-INDEX ───────────────────────────────────────────────────────────────────

export const zIndex = {
  base:    1,
  raised:  10,
  dropdown:100,
  modal:   200,
  toast:   300,
};

// ── LAYOUT ────────────────────────────────────────────────────────────────────

export const layout = {
  sidebarW:  '256px',
  topbarH:   '60px',
};

// ── MOTION ────────────────────────────────────────────────────────────────────

export const motion = {
  fast:   '140ms cubic-bezier(0.4,0,0.2,1)',
  normal: '240ms cubic-bezier(0.4,0,0.2,1)',
  slow:   '380ms cubic-bezier(0.4,0,0.2,1)',
};
