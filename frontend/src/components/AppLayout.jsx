import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to:'/dashboard', label:'Command Center',  icon:<I d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 3h2v2h-2zm4 0h2v2h-2zm-4 4h2v2h-2zm4 0h2v2h-2z"/> },
  { to:'/incidents', label:'Incidents',       icon:<I d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/> },
  { to:'/incidents/new', label:'Log Incident', icon:<I d="M12 5v14M5 12h14"/>, highlight:true },
  { to:'/tracking',  label:'Live Tracking',   icon:<I d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 4a6 6 0 1 1-6 6 6 6 0 0 1 6-6zm0 2a4 4 0 1 0 4 4 4 4 0 0 0-4-4z"/> },
  { to:'/vehicles',  label:'Fleet',           icon:<I d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm13 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/> },
  { to:'/analytics', label:'Analytics',       icon:<I d="M18 20V10M12 20V4M6 20v-6"/> },
  { to:'/users',     label:'Users',           icon:<I d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 0a3 3 0 0 0 0-6M23 21v-2a4 4 0 0 0-3-3.87"/>, adminOnly:true },
];

function I({ d }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)', letterSpacing:'0.05em' }}>
      {t.toLocaleTimeString('en-GB')} GMT
    </span>
  );
}

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const navItems = NAV.filter(n => !n.adminOnly || isAdmin());

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg-void)' }}>

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 62 : 'var(--sidebar-w)',
        background:'var(--bg-base)',
        borderRight:'1px solid var(--border-subtle)',
        display:'flex', flexDirection:'column',
        transition:'width var(--ease-slow)',
        flexShrink:0, overflow:'hidden', position:'relative', zIndex:10,
      }}>

        {/* Accent line top */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, var(--amber), transparent)', opacity:0.6 }} />

        {/* Brand */}
        <div style={{ padding: collapsed ? '18px 14px' : '18px 20px', borderBottom:'1px solid var(--border-faint)', display:'flex', alignItems:'center', gap:12, minHeight:70 }}>
          <div style={{ width:36, height:36, borderRadius:'var(--r-sm)', background:'var(--amber)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'var(--shadow-amber)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          {!collapsed && (
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:16, color:'var(--amber)', letterSpacing:'0.1em', whiteSpace:'nowrap' }}>SwiftAid</div>
              <div style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:1 }}>Emergency Dispatch</div>
            </div>
          )}
        </div>

        {/* Live indicator */}
        {!collapsed && (
          <div style={{ margin:'10px 12px', padding:'6px 12px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:'var(--r-sm)', display:'flex', alignItems:'center', gap:7 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', animation:'pulse 2s ease-in-out infinite', flexShrink:0 }} />
            <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--green)', letterSpacing:'0.1em' }}>SYSTEM LIVE</span>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px 8px', overflowY:'auto', display:'flex', flexDirection:'column', gap:2 }}>
          {navItems.map(item => {
            const active = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to) && item.to !== '/incidents/new');
            const isNew = item.to === '/incidents/new';
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                style={{
                  display:'flex', alignItems:'center', gap:11,
                  padding: collapsed ? '10px 12px' : '10px 14px',
                  borderRadius:'var(--r-sm)',
                  color: active ? (isNew ? 'var(--amber)' : 'var(--amber)') : 'var(--text-secondary)',
                  background: active ? (isNew ? 'var(--amber-soft)' : 'var(--amber-soft)') : isNew ? 'rgba(245,158,11,0.06)' : 'transparent',
                  border: active ? '1px solid var(--amber-border)' : `1px solid ${isNew ? 'rgba(245,158,11,0.15)' : 'transparent'}`,
                  textDecoration:'none',
                  fontSize:13, fontWeight: active ? 600 : 400,
                  transition:'all var(--ease-fast)',
                  whiteSpace:'nowrap', overflow:'hidden',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background='var(--bg-raised)'; e.currentTarget.style.color='var(--text-primary)'; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background= isNew ? 'rgba(245,158,11,0.06)' : 'transparent'; e.currentTarget.style.color='var(--text-secondary)'; }}}
              >
                <span style={{ flexShrink:0, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                {!collapsed && <span style={{ flex:1 }}>{item.label}</span>}
                {!collapsed && isNew && (
                  <span style={{ fontSize:9, fontWeight:700, background:'var(--amber)', color:'#000', padding:'2px 6px', borderRadius:10, letterSpacing:'0.05em' }}>NEW</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: collapsed ? '12px 8px' : '12px', borderTop:'1px solid var(--border-faint)', display:'flex', alignItems:'center', gap:10, overflow:'hidden' }}>
          <div style={{
            width:34, height:34, borderRadius:'var(--r-sm)', background:'var(--amber-soft)',
            border:'1px solid var(--amber-border)', display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, color:'var(--amber)', flexShrink:0,
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          {!collapsed && (
            <>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{user?.role?.replace('_',' ')}</div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                style={{ width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'var(--r-sm)', color:'var(--text-muted)', transition:'all var(--ease-fast)', flexShrink:0 }}
                onMouseEnter={e => { e.currentTarget.style.background='var(--red-soft)'; e.currentTarget.style.color='var(--red)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)'; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            position:'absolute', top:'50%', right:-11, transform:'translateY(-50%)',
            width:22, height:22, borderRadius:'50%', background:'var(--bg-raised)',
            border:'1px solid var(--border-normal)', display:'flex', alignItems:'center', justifyContent:'center',
            color:'var(--text-secondary)', zIndex:20, transition:'all var(--ease-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--amber-soft)'; e.currentTarget.style.color='var(--amber)'; e.currentTarget.style.borderColor='var(--amber-border)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--bg-raised)'; e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.borderColor='var(--border-normal)'; }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: collapsed ? 'rotate(180deg)' : '', transition:'transform var(--ease-normal)' }}>
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      </aside>

      {/* ── Main ──────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Topbar */}
        <header style={{
          height:'var(--topbar-h)', background:'var(--bg-base)', borderBottom:'1px solid var(--border-faint)',
          display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', flexShrink:0,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
            <span style={{ color:'var(--amber)' }}>SwiftAid</span>
            <span style={{ color:'var(--border-normal)' }}>/</span>
            <span>{navItems.find(n => location.pathname.startsWith(n.to))?.label || 'Dashboard'}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <Clock />
            <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{user?.email}</div>
          </div>
        </header>

        {/* Content */}
        <main style={{
          flex:1, overflowY:'auto', padding:24,
          background:'var(--bg-void)',
          backgroundImage:'linear-gradient(rgba(245,158,11,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.012) 1px, transparent 1px)',
          backgroundSize:'48px 48px',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
