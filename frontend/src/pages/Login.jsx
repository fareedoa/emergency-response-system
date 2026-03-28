import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

// Role → landing page mapping
const ROLE_HOME = {
  SYSTEM_ADMIN:   '/dashboard',
  HOSPITAL_ADMIN: '/incidents',
  POLICE_ADMIN:   '/incidents',
  FIRE_ADMIN:     '/incidents',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const handleSubmit = async e => {
    e.preventDefault();
    const newErrs = { email: '', password: '' };
    if (!email) newErrs.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) newErrs.email = 'Please enter a valid email address';
    
    if (!password) newErrs.password = 'Password is required';
    
    if (newErrs.email || newErrs.password) {
      setErrors(newErrs);
      return;
    }
    
    setErrors({ email: '', password: '' });
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Access granted');
      navigate(ROLE_HOME[user?.role] || '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed. Check credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      {/* Grid bg */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(var(--grid-overlay) 1px, transparent 1px), linear-gradient(90deg, var(--grid-overlay) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
      {/* Glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, var(--brand-soft) 0%, transparent 65%)', pointerEvents: 'none' }} />
      {/* Scan line */}
      <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--brand-glow), transparent)', animation: 'scandown 12s ease-in-out infinite', pointerEvents: 'none' }} />
      {/* Corner decorators */}
      {[{ top: '20px', left: '20px', borderTop: '2px solid var(--brand-border)', borderLeft: '2px solid var(--brand-border)' }, { bottom: '20px', right: '20px', borderBottom: '2px solid var(--brand-border)', borderRight: '2px solid var(--brand-border)' }].map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 48, height: 48, pointerEvents: 'none', ...s }} />
      ))}

      {/* ── LEFT PANEL ── */}
      <div className="login-left" style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', gap: 32, padding: '60px 72px', borderRight: '1px solid var(--border-faint)', display: 'none' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
            <div style={{ width: 52, height: 52, borderRadius: 'var(--r-md)', background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-brand)' }}>
              <Activity size={28} color="var(--on-brand)" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--color-brand)', letterSpacing: '0.1em', lineHeight: 1 }}>SwiftAid</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 3 }}>National Emergency Response</div>
            </div>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.02em' }}>Ghana's Critical<br />Infrastructure Platform</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 380 }}>Coordinating police, fire, hospitals and ambulances across all regions in real-time. Every second counts — this system makes them count.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[{ val: '24 / 7', label: 'Always On', color: 'var(--color-success)' }, { val: '10+', label: 'Regions', color: 'var(--color-dispatch)' }, { val: '< 8m', label: 'Avg Dispatch', color: 'var(--color-brand)' }, { val: '4', label: 'Services', color: 'var(--color-warning)' }].map(s => (
            <div key={s.label} style={{ padding: '16px 18px', background: 'var(--bg-raised)', border: '1px solid var(--border-faint)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[['Ambulance', 'var(--color-success)'], ['Police', 'var(--color-dispatch)'], ['Fire Service', 'var(--color-danger)'], ['Hospitals', 'var(--color-brand)']].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', background: `color-mix(in srgb, ${color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`, borderRadius: 'var(--r-full)', fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420, animation: 'fadeUp 0.5s ease' }}>
          {/* Mobile logo */}
          <div className="login-mobile-logo" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-brand)', flexShrink: 0 }}>
              <Activity size={24} color="var(--on-brand)" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--color-brand)', letterSpacing: '0.08em', lineHeight: 1 }}>SwiftAid</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Emergency Response Platform</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-xl)', padding: '32px', boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, var(--color-brand), transparent)' }} />
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 5 }}>Operator Sign In</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Authorised personnel only. All access is logged.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: errors.email ? 'var(--color-danger)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: errors.email ? 'var(--color-danger)' : 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input type="email" value={email} onChange={e => {setEmail(e.target.value); if(errors.email) setErrors({...errors, email: ''})}} placeholder="operator@emergency.gov.gh" autoComplete="username"
                    style={{ width: '100%', background: 'var(--bg-raised)', border: `1px solid ${errors.email ? 'var(--color-danger)' : 'var(--border-subtle)'}`, borderRadius: 'var(--r-sm)', padding: '11px 14px 11px 40px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                    onFocus={e => { e.target.style.borderColor = errors.email ? 'var(--color-danger)' : 'var(--color-brand)'; e.target.style.boxShadow = errors.email ? '0 0 0 3px color-mix(in srgb, var(--color-danger) 20%, transparent)' : '0 0 0 3px var(--brand-soft)'; }}
                    onBlur={e => { e.target.style.borderColor = errors.email ? 'var(--color-danger)' : 'var(--border-subtle)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                {errors.email && <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 2 }}>{errors.email}</div>}
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: errors.password ? 'var(--color-danger)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: errors.password ? 'var(--color-danger)' : 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => {setPassword(e.target.value); if(errors.password) setErrors({...errors, password: ''})}} placeholder="••••••••••••" autoComplete="current-password"
                    style={{ width: '100%', background: 'var(--bg-raised)', border: `1px solid ${errors.password ? 'var(--color-danger)' : 'var(--border-subtle)'}`, borderRadius: 'var(--r-sm)', padding: '11px 42px 11px 40px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                    onFocus={e => { e.target.style.borderColor = errors.password ? 'var(--color-danger)' : 'var(--color-brand)'; e.target.style.boxShadow = errors.password ? '0 0 0 3px color-mix(in srgb, var(--color-danger) 20%, transparent)' : '0 0 0 3px var(--brand-soft)'; }}
                    onBlur={e => { e.target.style.borderColor = errors.password ? 'var(--color-danger)' : 'var(--border-subtle)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)} aria-label={showPass ? 'Hide' : 'Show'} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', padding: 0, display: 'flex', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 2 }}>{errors.password}</div>}
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} style={{ marginTop: 6, padding: '13px', width: '100%', background: loading ? 'var(--brand-dim)' : 'var(--color-brand)', color: 'var(--on-brand)', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, letterSpacing: '0.1em', borderRadius: 'var(--r-sm)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: loading ? 'none' : 'var(--shadow-brand)' }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 36px var(--brand-glow)'; }}}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = loading ? 'none' : 'var(--shadow-brand)'; }}>
                {loading
                  ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'rgba(0,0,0,0.8)', borderRadius: '50%', animation: 'spin 0.75s linear infinite', display: 'inline-block' }} />AUTHENTICATING...</>
                  : <><LogIn size={16} strokeWidth={2.5} />ACCESS COMMAND CENTER</>
                }
              </button>
            </form>

            <div style={{ marginTop: 18, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
              Don't have an account? <Link to="/register" style={{ color: 'var(--color-brand)', fontWeight: 600 }}>Register</Link>
            </div>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
            <span>© {new Date().getFullYear()} Republic of Ghana</span>
            <span style={{ color: 'var(--border-normal)' }}>·</span>
            <span>SwiftAid Emergency Platform</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .login-left { display: flex !important; }
          .login-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
}
