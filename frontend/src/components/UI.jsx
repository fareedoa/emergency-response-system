import { getStatusInfo, getSeverityInfo, getTypeInfo, getVehicleStatusInfo } from '../utils/constants';

/* ─────────────────────────────────────────────────────────
   CARD
───────────────────────────────────────────────────────── */
export function Card({ children, className = '', style, glowColor }) {
  return (
    <div
      className={`card ${className}`}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-lg)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: glowColor ? `0 0 30px ${glowColor}20` : 'var(--shadow-md)',
        transition: 'border-color var(--ease-fast)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE HEADER
───────────────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:28, gap:16, flexWrap:'wrap' }}>
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.01em' }}>
          {title}
        </h1>
        {subtitle && <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:5 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>{actions}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────── */
export function StatCard({ label, value, sub, color='var(--amber)', icon, loading }) {
  return (
    <Card style={{ padding:'22px 24px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <span style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.12em' }}>{label}</span>
        {icon && (
          <span style={{ width:36, height:36, borderRadius:'var(--r-sm)', background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', color, fontSize:16 }}>
            {icon}
          </span>
        )}
      </div>
      {loading ? (
        <div style={{ height:38, borderRadius:'var(--r-sm)', background:'linear-gradient(90deg, var(--bg-raised) 25%, var(--bg-overlay) 50%, var(--bg-raised) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite' }} />
      ) : (
        <div style={{ fontFamily:'var(--font-display)', fontSize:38, fontWeight:800, color, letterSpacing:'-0.02em', lineHeight:1 }}>{value ?? '—'}</div>
      )}
      {sub && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:8 }}>{sub}</div>}
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────
   BUTTON
───────────────────────────────────────────────────────── */
const BTN_VARIANTS = {
  primary:   { bg:'var(--amber)', color:'#000', border:'transparent', hoverShadow:'var(--shadow-amber)' },
  secondary: { bg:'transparent', color:'var(--text-secondary)', border:'var(--border-normal)', hoverBg:'var(--bg-raised)' },
  danger:    { bg:'var(--red-soft)', color:'var(--red)', border:'rgba(239,68,68,0.25)' },
  success:   { bg:'var(--green-soft)', color:'var(--green)', border:'rgba(16,185,129,0.25)' },
  cyan:      { bg:'var(--cyan-soft)', color:'var(--cyan)', border:'var(--cyan-border)' },
  ghost:     { bg:'transparent', color:'var(--text-muted)', border:'transparent' },
};

export function Btn({ children, variant='primary', size='md', onClick, disabled, type='button', icon, loading }) {
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.primary;
  const pad = size==='sm' ? '6px 14px' : size==='lg' ? '12px 28px' : '9px 20px';
  const fs = size==='sm' ? 12 : size==='lg' ? 15 : 13;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display:'inline-flex', alignItems:'center', gap:8, padding:pad, fontSize:fs,
        fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:'0.04em',
        borderRadius:'var(--r-sm)', border:`1px solid ${v.border}`,
        background: v.bg, color: v.color,
        cursor: disabled||loading ? 'not-allowed' : 'pointer',
        opacity: disabled||loading ? 0.6 : 1,
        transition:'all var(--ease-fast)',
        whiteSpace:'nowrap',
      }}
      onMouseEnter={e => { if (!disabled&&!loading) { if (v.hoverShadow) e.currentTarget.style.boxShadow=v.hoverShadow; if (v.hoverBg) e.currentTarget.style.background=v.hoverBg; e.currentTarget.style.transform='translateY(-1px)'; }}}
      onMouseLeave={e => { e.currentTarget.style.boxShadow=''; e.currentTarget.style.background=v.bg; e.currentTarget.style.transform=''; }}
    >
      {loading ? <span className="anim-spin" style={{ width:14, height:14, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block' }} /> : icon}
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   BADGES
───────────────────────────────────────────────────────── */
function Pill({ label, color, dot }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px',
      borderRadius:20, fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
      color, background:`${color}15`, border:`1px solid ${color}30`, whiteSpace:'nowrap',
    }}>
      {dot && <span style={{ width:5, height:5, borderRadius:'50%', background:color, flexShrink:0 }} />}
      {label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const info = getStatusInfo(status);
  return <Pill label={info.label} color={info.color} dot />;
}
export function SeverityBadge({ severity }) {
  const info = getSeverityInfo(severity);
  return <Pill label={info.label} color={info.color} />;
}
export function TypeBadge({ type }) {
  const info = getTypeInfo(type);
  return <Pill label={info.short} color={info.color} />;
}
export function VehicleStatusBadge({ status }) {
  const info = getVehicleStatusInfo(status);
  return <Pill label={info.label} color={info.color} dot />;
}

/* ─────────────────────────────────────────────────────────
   FORM PRIMITIVES
───────────────────────────────────────────────────────── */
export function Field({ label, required, error, hint, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && (
        <label style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
          {label}{required && <span style={{ color:'var(--red)', marginLeft:3 }}>*</span>}
        </label>
      )}
      {children}
      {hint && !error && <span style={{ fontSize:11, color:'var(--text-muted)' }}>{hint}</span>}
      {error && <span style={{ fontSize:11, color:'var(--red)' }}>{error}</span>}
    </div>
  );
}

const inputStyle = {
  background:'var(--bg-raised)', border:'1px solid var(--border-subtle)',
  borderRadius:'var(--r-sm)', padding:'10px 14px', color:'var(--text-primary)',
  fontSize:13, outline:'none', width:'100%', transition:'border-color var(--ease-fast)',
};

export function Input({ className, style, ...props }) {
  return (
    <input
      style={{ ...inputStyle, ...style }}
      onFocus={e => { e.target.style.borderColor='var(--amber)'; e.target.style.boxShadow='0 0 0 3px var(--amber-soft)'; }}
      onBlur={e => { e.target.style.borderColor='var(--border-subtle)'; e.target.style.boxShadow='none'; }}
      {...props}
    />
  );
}

export function Select({ children, style, ...props }) {
  return (
    <select
      style={{ ...inputStyle, cursor:'pointer', appearance:'none',
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237B92B8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', paddingRight:36, ...style,
      }}
      onFocus={e => { e.target.style.borderColor='var(--amber)'; }}
      onBlur={e => { e.target.style.borderColor='var(--border-subtle)'; }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ style, ...props }) {
  return (
    <textarea
      style={{ ...inputStyle, resize:'vertical', minHeight:80, ...style }}
      onFocus={e => { e.target.style.borderColor='var(--amber)'; e.target.style.boxShadow='0 0 0 3px var(--amber-soft)'; }}
      onBlur={e => { e.target.style.borderColor='var(--border-subtle)'; e.target.style.boxShadow='none'; }}
      {...props}
    />
  );
}

/* ─────────────────────────────────────────────────────────
   MODAL
───────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, maxWidth=540 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(4,6,13,0.85)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:24, animation:'fadeIn 0.15s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:'100%', maxWidth, background:'var(--bg-surface)', border:'1px solid var(--border-normal)',
        borderRadius:'var(--r-lg)', boxShadow:'var(--shadow-lg)', animation:'fadeUp 0.2s ease',
        maxHeight:'90vh', display:'flex', flexDirection:'column',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid var(--border-subtle)', flexShrink:0 }}>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:800 }}>{title}</h3>
          <button onClick={onClose} style={{ width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'var(--r-sm)', color:'var(--text-muted)', transition:'all var(--ease-fast)' }}
            onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ padding:24, overflowY:'auto' }}>{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SPINNER / EMPTY / TABLE
───────────────────────────────────────────────────────── */
export function Spinner({ size=28, color='var(--amber)' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:48 }}>
      <div style={{ width:size, height:size, border:`2px solid var(--border-subtle)`, borderTopColor:color, borderRadius:'50%', animation:'spin 0.75s linear infinite' }} />
    </div>
  );
}

export function Empty({ icon, title, msg }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 24px' }}>
      {icon && <div style={{ fontSize:40, marginBottom:14, opacity:0.3 }}>{icon}</div>}
      <div style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:700, color:'var(--text-secondary)', marginBottom:8 }}>{title}</div>
      {msg && <div style={{ fontSize:13, color:'var(--text-muted)', maxWidth:280, margin:'0 auto' }}>{msg}</div>}
    </div>
  );
}

export function DataTable({ cols, rows, onRowClick, loading, emptyTitle='No data', emptyIcon='📋' }) {
  if (loading) return <Spinner />;
  if (!rows?.length) return <Empty icon={emptyIcon} title={emptyTitle} />;
  return (
    <div style={{ overflowX:'auto', borderRadius:'var(--r-lg)', border:'1px solid var(--border-subtle)' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.key} style={{ padding:'11px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.12em', background:'var(--bg-base)', borderBottom:'1px solid var(--border-subtle)', whiteSpace:'nowrap', width:c.w }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default', transition:'background var(--ease-fast)', borderBottom: i < rows.length-1 ? '1px solid var(--border-faint)' : 'none' }}
              onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background='var(--bg-raised)'; }}
              onMouseLeave={e => e.currentTarget.style.background=''}
            >
              {cols.map(c => (
                <td key={c.key} style={{ padding:'13px 16px', fontSize:13, color:'var(--text-primary)', verticalAlign:'middle' }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION TITLE
───────────────────────────────────────────────────────── */
export function SectionTitle({ children, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
      <h3 style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, color:'var(--text-primary)', letterSpacing:'0.03em' }}>
        {children}
      </h3>
      {action}
    </div>
  );
}
