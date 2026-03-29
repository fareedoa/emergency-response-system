import { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle, CheckCircle, Clock, Loader2, OctagonAlert,
  HeartPulse, Flame, ShieldAlert, Car, FileQuestion,
  Ambulance, Shield, Bike, Truck,
  ChevronUp, ChevronDown, ChevronsUpDown, X, Info
} from 'lucide-react';
import { getTypeInfo, getStatusInfo } from '../utils/constants';

// ── Layout primitives ──────────────────────────────────────────────────────
export function Card({ children, style, glowColor, onClick, className }) {
  const base = {
    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--r-lg)', padding: 20, position: 'relative', overflow: 'hidden',
    transition: 'border-color var(--ease-fast), box-shadow var(--ease-fast)',
    ...(glowColor && { borderColor: `color-mix(in srgb, ${glowColor} 35%, transparent)`, boxShadow: `0 0 20px color-mix(in srgb, ${glowColor} 12%, transparent)` }),
    ...(onClick && { cursor: 'pointer' }),
    ...style,
  };
  return <div className={className} style={base} onClick={onClick}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 4 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{children}</h3>
      {action}
    </div>
  );
}

// ── Button ──────────────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary:   { bg:'var(--color-brand)', color:'var(--on-brand)', border:'transparent', shadow:'var(--shadow-brand)' },
  secondary: { bg:'var(--bg-raised)',   color:'var(--text-secondary)', border:'var(--border-subtle)', shadow:'none' },
  danger:    { bg:'var(--color-danger)',color:'#fff', border:'transparent', shadow:'0 0 16px color-mix(in srgb, var(--color-danger) 30%, transparent)' },
  ghost:     { bg:'transparent', color:'var(--text-secondary)', border:'transparent', shadow:'none' },
  dispatch:  { bg:'var(--color-dispatch)', color:'#000', border:'transparent', shadow:'0 0 16px color-mix(in srgb, var(--color-dispatch) 30%, transparent)' },
};
const BTN_SIZES = {
  sm: { padding: '5px 12px', fontSize: 11 },
  md: { padding: '9px 18px', fontSize: 13 },
  lg: { padding: '13px 24px', fontSize: 14 },
};

export function Btn({ children, variant = 'primary', size = 'md', icon, onClick, disabled, loading, type = 'button', style }) {
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.primary;
  const s = BTN_SIZES[size] || BTN_SIZES.md;
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, ...s, background: (disabled || loading) ? 'var(--bg-raised)' : v.bg, color: (disabled || loading) ? 'var(--text-muted)' : v.color, border: `1px solid ${v.border}`, borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.06em', boxShadow: v.shadow, cursor: (disabled || loading) ? 'not-allowed' : 'pointer', transition: 'all var(--ease-fast)', ...style }}
      onMouseEnter={e => { if (!disabled && !loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.filter = ''; }}
    >
      {loading ? <Loader2 size={14} style={{ animation: 'spin 0.75s linear infinite' }} /> : icon}
      {children}
    </button>
  );
}

// ── Badges ──────────────────────────────────────────────────────────────────
const STATUS_ICONS = {
  CREATED:     <Clock size={11} strokeWidth={2} />,
  DISPATCHED:  <Loader2 size={11} strokeWidth={2} style={{ animation: 'spin 1.5s linear infinite' }} />,
  IN_PROGRESS: <AlertTriangle size={11} strokeWidth={2} />,
  RESOLVED:    <CheckCircle size={11} strokeWidth={2} />,
};
const STATUS_COLORS = {
  CREATED: 'var(--color-brand)', DISPATCHED: 'var(--color-dispatch)',
  IN_PROGRESS: 'var(--color-warning)', RESOLVED: 'var(--color-success)',
};

export function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || 'var(--text-muted)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 'var(--r-full)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color, background: `color-mix(in srgb, ${color} 13%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 28%, transparent)` }}>
      {STATUS_ICONS[status]}
      {status?.replace('_', ' ')}
    </span>
  );
}

const SEV_ICONS = {
  CRITICAL: <OctagonAlert size={11} strokeWidth={2} />,
  HIGH:     <AlertTriangle size={11} strokeWidth={2} />,
  MEDIUM:   <Info size={11} strokeWidth={2} />,
  LOW:      <CheckCircle size={11} strokeWidth={2} />,
};
const SEV_COLORS = {
  CRITICAL: 'var(--color-danger)', HIGH: 'var(--color-warning)',
  MEDIUM: 'var(--color-brand)', LOW: 'var(--color-success)',
};

export function SeverityBadge({ severity }) {
  const color = SEV_COLORS[severity] || 'var(--text-muted)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 'var(--r-full)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color, background: `color-mix(in srgb, ${color} 13%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 28%, transparent)` }}>
      {SEV_ICONS[severity]}
      {severity}
    </span>
  );
}

const TYPE_ICON_COMPONENTS = {
  MEDICAL_EMERGENCY: HeartPulse,
  FIRE:              Flame,
  CRIME:             ShieldAlert,
  ROBBERY:           AlertTriangle,
  ACCIDENT:          Car,
  OTHER:             FileQuestion,
};

export function TypeBadge({ type }) {
  const info = getTypeInfo(type);
  const IconComp = TYPE_ICON_COMPONENTS[type] || FileQuestion;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 'var(--r-full)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: info.color, background: `color-mix(in srgb, ${info.color} 13%, transparent)`, border: `1px solid color-mix(in srgb, ${info.color} 28%, transparent)` }}>
      <IconComp size={11} strokeWidth={2} />
      {info.short}
    </span>
  );
}

const VSTATUS_COLORS = {
  IDLE: 'var(--color-success)', DISPATCHED: 'var(--color-dispatch)',
  EN_ROUTE: 'var(--color-warning)', ON_SCENE: 'var(--color-danger)', RETURNING: 'var(--color-brand)',
};

export function VehicleStatusBadge({ status }) {
  const color = VSTATUS_COLORS[status] || 'var(--text-muted)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 'var(--r-full)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color, background: `color-mix(in srgb, ${color} 13%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 28%, transparent)` }}>
      <Truck size={11} strokeWidth={2} />
      {status?.replace('_', ' ')}
    </span>
  );
}

// ── Vehicle icon component lookup ─────────────────────────────────────────
const VEHICLE_ICON_COMPS = {
  AMBULANCE:   Ambulance,
  POLICE_CAR:  Shield,
  FIRE_TRUCK:  Flame,
  PATROL_BIKE: Bike,
};
export function VehicleIcon({ type, size = 16, color = 'currentColor' }) {
  const Comp = VEHICLE_ICON_COMPS[type] || Truck;
  return <Comp size={size} color={color} strokeWidth={1.8} />;
}

// ── StatCard ──────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color, icon, loading }) {
  if (loading) return <SkeletonBlock height={100} />;
  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color || 'var(--color-brand)'}, transparent)`, opacity: 0.7 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</div>
        {icon && <div style={{ color: color || 'var(--color-brand)', opacity: 0.7 }}>{icon}</div>}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: color || 'var(--color-brand)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}

// ── AlertBanner ────────────────────────────────────────────────────────────
export function AlertBanner({ children, color = 'var(--color-danger)', icon, action }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: `color-mix(in srgb, ${color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`, borderRadius: 'var(--r-md)', marginBottom: 20, fontSize: 13 }}>
      <span style={{ color, flexShrink: 0 }}>{icon || <AlertTriangle size={16} />}</span>
      <span style={{ flex: 1, fontWeight: 600, color }}>{children}</span>
      {action}
      <button onClick={() => setVisible(false)} style={{ color, opacity: 0.7, display: 'flex' }}>
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}

// ── DataTable ──────────────────────────────────────────────────────────────
export function DataTable({ cols, rows, onRowClick, loading, emptyTitle, emptyIcon, emptyMsg }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = [...(rows || [])].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey], bv = b[sortKey];
    const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ChevronsUpDown size={11} style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  };

  if (loading) return (
    <div style={{ padding: 20 }}>
      {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} height={40} style={{ marginBottom: 8 }} />)}
    </div>
  );

  if (!rows?.length && !loading) return (
    <Empty icon={emptyIcon} title={emptyTitle || 'No data'} msg={emptyMsg} />
  );

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            {cols.map(c => (
              <th key={c.key} onClick={() => c.sortable !== false && toggleSort(c.key)}
                style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', width: c.w, cursor: c.sortable !== false ? 'pointer' : 'default', userSelect: 'none' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {c.label}
                  {c.sortable !== false && <SortIcon colKey={c.key} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.id || i} onClick={() => onRowClick?.(row)}
              style={{ borderBottom: '1px solid var(--border-faint)', cursor: onRowClick ? 'pointer' : 'default', background: i % 2 === 1 ? 'color-mix(in srgb, var(--bg-raised) 40%, transparent)' : 'transparent', transition: 'background var(--ease-fast)' }}
              onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 1 ? 'color-mix(in srgb, var(--bg-raised) 40%, transparent)' : 'transparent'; }}
            >
              {cols.map(c => (
                <td key={c.key} style={{ padding: '12px 16px', color: 'var(--text-primary)', verticalAlign: 'middle' }}>
                  {c.render ? c.render(row[c.key], row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = 520 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (open) ref.current?.focus();
    const onKey = e => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose?.()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn 0.2s ease' }}>
      <div ref={ref} tabIndex={-1} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-normal)', borderRadius: 'var(--r-xl)', width: '100%', maxWidth, maxHeight: 'calc(100vh - 40px)', boxShadow: 'var(--shadow-xl)', outline: 'none', animation: 'fadeUp 0.25s ease', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--color-brand), transparent)', zIndex: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 20px', flexShrink: 0 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 'var(--r-sm)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-raised)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '0 24px 24px', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Form helpers ──────────────────────────────────────────────────────────
export function Field({ label, children, error, required }) {
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}{required && <span style={{ color: 'var(--color-danger)', marginLeft: 3 }}>*</span>}</label>}
      {children}
      {error && <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={11} />{error}</div>}
    </div>
  );
}

const inputBase = { width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)', padding: '10px 13px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', transition: 'border-color var(--ease-fast), box-shadow var(--ease-fast)' };
const focusHandlers = {
  onFocus: e => { e.target.style.borderColor = 'var(--color-brand)'; e.target.style.boxShadow = '0 0 0 3px var(--brand-soft)'; },
  onBlur:  e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none'; },
};
export function Input(props) { return <input style={inputBase} {...focusHandlers} {...props} />; }
export function Select({ children, ...props }) { return <select style={{ ...inputBase, appearance: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%237A93BF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 }} {...focusHandlers} {...props}>{children}</select>; }
export function Textarea(props) { return <textarea style={{ ...inputBase, resize: 'vertical', fontFamily: 'var(--font-body)' }} {...focusHandlers} {...props} />; }

// ── Skeleton / Empty ───────────────────────────────────────────────────────
export function SkeletonBlock({ height = 20, style }) {
  return <div style={{ height, borderRadius: 'var(--r-sm)', background: 'var(--bg-raised)', animation: 'shimmer 1.5s infinite', ...style }} />;
}
export function SkeletonCard() {
  return <Card><SkeletonBlock height={16} style={{ marginBottom: 12, width: '60%' }} /><SkeletonBlock height={36} style={{ marginBottom: 8 }} /><SkeletonBlock height={12} style={{ width: '40%' }} /></Card>;
}
export function Spinner() {
  return <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={32} color="var(--color-brand)" style={{ animation: 'spin 0.75s linear infinite' }} /></div>;
}
export function Empty({ icon, title, msg, action }) {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center' }}>
      {icon && <div style={{ fontSize: 40, marginBottom: 16, color: 'var(--text-muted)', display: 'flex', justifyContent: 'center' }}>{typeof icon === 'string' ? icon : icon}</div>}
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>{title}</div>
      {msg && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: action ? 20 : 0 }}>{msg}</div>}
      {action}
    </div>
  );
}
