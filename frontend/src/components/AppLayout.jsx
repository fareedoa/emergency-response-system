import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import {
  LayoutDashboard, AlertTriangle, Plus, Navigation,
  Truck, BarChart2, Users, LogOut, ChevronLeft,
  Menu, Activity, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/dashboard',     label: 'Command Center', Icon: LayoutDashboard, roles: null },
  { to: '/incidents',     label: 'Incidents',      Icon: AlertTriangle,   roles: null },
  { to: '/incidents/new', label: 'Log Incident',   Icon: Plus,            roles: ['SYSTEM_ADMIN','HOSPITAL_ADMIN','POLICE_ADMIN','FIRE_ADMIN'], highlight: true },
  { to: '/tracking',      label: 'Live Tracking',  Icon: Navigation,      roles: null },
  { to: '/facilities',    label: 'Facilities',     Icon: Activity,        roles: ['SYSTEM_ADMIN','HOSPITAL_ADMIN','POLICE_ADMIN','FIRE_ADMIN'] },
  { to: '/vehicles',      label: 'Fleet',          Icon: Truck,           roles: null },
  { to: '/analytics',     label: 'Analytics',      Icon: BarChart2,       roles: null },
  { to: '/users',         label: 'Users',          Icon: Users,           roles: ['SYSTEM_ADMIN'] },
  { to: '/settings',      label: 'Settings',       Icon: Settings,        roles: null },
];

const ROLE_LABELS = {
  SYSTEM_ADMIN:   'System Admin',
  HOSPITAL_ADMIN: 'Hospital Admin',
  POLICE_ADMIN:   'Police Admin',
  FIRE_ADMIN:     'Fire Admin',
};

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
      {t.toLocaleTimeString('en-GB')} GMT
    </span>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const navItems = NAV.filter(n => {
    if (n.roles && !n.roles.includes(user?.role)) return false;
    return true;
  });

  const currentPage = navItems.find(n => {
    if (n.to === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(n.to) && n.to !== '/incidents/new';
  });

  const SidebarContent = ({ isCollapsed }) => (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--color-brand), transparent)', opacity: 0.7 }} />

      {/* Brand */}
      <div style={{ padding: isCollapsed ? '16px 14px' : '16px 20px', borderBottom: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', gap: 11, minHeight: 68 }}>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-brand)' }}>
          <Activity size={18} color="var(--on-brand)" strokeWidth={2.5} />
        </div>
        {!isCollapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--color-brand)', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>SwiftAid</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 1, whiteSpace: 'nowrap' }}>Emergency Response · Ghana</div>
          </div>
        )}
      </div>

      {/* Live indicator */}
      {!isCollapsed && (
        <div style={{ margin: '10px 12px', padding: '6px 12px', background: 'var(--success-soft)', border: '1px solid var(--success-border)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', animation: 'pulse 2s ease-in-out infinite', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-success)', letterSpacing: '0.1em' }}>SYSTEM LIVE</span>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => {
          const isActive = item.to === '/dashboard'
            ? location.pathname === '/dashboard'
            : location.pathname.startsWith(item.to) && item.to !== '/incidents/new';
          const isNew = item.to === '/incidents/new';
          const accentColor = isNew ? 'var(--color-danger)' : 'var(--color-brand)';
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: isCollapsed ? '10px 12px' : '10px 13px',
                borderRadius: 'var(--r-sm)',
                color: isActive ? accentColor : 'var(--text-secondary)',
                background: isActive
                  ? `color-mix(in srgb, ${accentColor} 12%, transparent)`
                  : isNew ? `color-mix(in srgb, var(--color-danger) 6%, transparent)` : 'transparent',
                border: `1px solid ${isActive
                  ? `color-mix(in srgb, ${accentColor} 28%, transparent)`
                  : isNew ? `color-mix(in srgb, var(--color-danger) 15%, transparent)` : 'transparent'}`,
                textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 600 : 400,
                transition: 'all var(--ease-fast)', whiteSpace: 'nowrap', overflow: 'hidden',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-raised)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = isNew ? `color-mix(in srgb, var(--color-danger) 6%, transparent)` : 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
            >
              <span style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7, display: 'flex' }}>
                <item.Icon size={15} strokeWidth={isActive ? 2.5 : 1.8} />
              </span>
              {!isCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!isCollapsed && isNew && (
                <span style={{ fontSize: 9, fontWeight: 800, background: 'var(--color-danger)', color: '#fff', padding: '2px 6px', borderRadius: 'var(--r-full)', letterSpacing: '0.06em' }}>SOS</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: isCollapsed ? '12px 8px' : '12px', borderTop: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
        <div style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', background: 'var(--brand-soft)', border: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'var(--color-brand)', flexShrink: 0 }}>
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        {!isCollapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
            <button
              onClick={handleLogout} aria-label="Sign out" title="Sign out"
              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', color: 'var(--text-muted)', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-soft)'; e.currentTarget.style.color = 'var(--color-danger)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <LogOut size={14} strokeWidth={2} />
            </button>
          </>
        )}
      </div>

      {/* Collapse toggle (desktop) */}
      <button
        onClick={() => setCollapsed(c => !c)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{ position: 'absolute', top: '50%', right: -11, transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-raised)', border: '1px solid var(--border-normal)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', zIndex: 20 }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--brand-soft)'; e.currentTarget.style.color = 'var(--color-brand)'; e.currentTarget.style.borderColor = 'var(--brand-border)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-raised)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-normal)'; }}
      >
        <ChevronLeft size={11} strokeWidth={2.5} style={{ transform: collapsed ? 'rotate(180deg)' : '', transition: 'transform var(--ease-normal)' }} />
      </button>
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-void)' }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 98, animation: 'fadeIn 0.2s ease' }} />
      )}

      {/* Sidebar desktop */}
      <aside style={{ width: collapsed ? 60 : 'var(--sidebar-w)', background: 'var(--bg-base)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', transition: 'width var(--ease-slow)', flexShrink: 0, overflow: 'hidden', position: 'relative', zIndex: 10 }} className="sidebar-desktop">
        <SidebarContent isCollapsed={collapsed} />
      </aside>

      {/* Sidebar mobile */}
      <aside style={{ width: 'var(--sidebar-w)', background: 'var(--bg-base)', borderRight: '1px solid var(--border-subtle)', display: 'none', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 99, transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform var(--ease-normal)', overflow: 'hidden' }} className="sidebar-mobile">
        <SidebarContent isCollapsed={false} />
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{ height: 'var(--topbar-h)', background: 'var(--bg-base)', borderBottom: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setMobileOpen(o => !o)} className="mobile-hamburger" aria-label="Toggle sidebar"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--r-sm)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Menu size={16} strokeWidth={1.8} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <span style={{ color: 'var(--color-brand)' }}>SwiftAid</span>
              <span style={{ color: 'var(--border-normal)' }}>›</span>
              <span>{currentPage?.label || 'Dashboard'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Clock />
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 24, background: 'var(--bg-void)', backgroundImage: `linear-gradient(var(--grid-overlay) 1px, transparent 1px), linear-gradient(90deg, var(--grid-overlay) 1px, transparent 1px)`, backgroundSize: '48px 48px' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .mobile-hamburger { display: none !important; }
          .sidebar-mobile   { display: none !important; }
          .sidebar-desktop  { display: flex !important; }
        }
        @media (max-width: 768px) {
          .sidebar-desktop  { display: none !important; }
          .sidebar-mobile   { display: flex !important; }
          .hide-mobile      { display: none !important; }
        }
      `}</style>
    </div>
  );
}
