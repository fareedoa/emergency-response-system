import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Access granted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed. Check credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-void)', display:'flex', position:'relative', overflow:'hidden' }}>

      {/* Grid background */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)',
        backgroundSize:'60px 60px',
      }} />

      {/* Radial glow */}
      <div style={{
        position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:600, height:600, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)',
        pointerEvents:'none',
      }} />

      {/* Scan line animation */}
      <div style={{
        position:'absolute', left:0, right:0, height:2,
        background:'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)',
        animation:'scandown 10s ease-in-out infinite', pointerEvents:'none',
      }} />

      {/* Corner decorators */}
      {[['top:24px','left:24px','borderTop:2px solid','borderLeft:2px solid'],
        ['bottom:24px','right:24px','borderBottom:2px solid','borderRight:2px solid']].map((corners, i) => (
        <div key={i} style={{
          position:'absolute', width:50, height:50,
          ...Object.fromEntries(corners.map(s => { const [k,v]=s.split(':'); return [k.trim(), v.trim()]; })),
          borderColor:'rgba(245,158,11,0.25)', pointerEvents:'none',
        }} />
      ))}

      {/* Left panel - branding */}
      <div style={{ display:'none', flex:1, flexDirection:'column', justifyContent:'center', alignItems:'flex-start', padding:'60px 80px', borderRight:'1px solid var(--border-faint)', '@media(min-width:1024px)':{display:'flex'} }}>
      </div>

      {/* Center/Right - form panel */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{
          width:'100%', maxWidth:420, animation:'fadeUp 0.5s ease',
        }}>
          {/* Logo block */}
          <div style={{ marginBottom:40 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
              <div style={{
                width:48, height:48, borderRadius:'var(--r-md)',
                background:'var(--amber)', display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'var(--shadow-amber)',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:26, color:'var(--amber)', letterSpacing:'0.12em', lineHeight:1 }}>SwiftAid</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:3 }}>Emergency Response Platform</div>
              </div>
            </div>
              SwiftAid
          </div>

          {/* Form card */}
          <div style={{
            background:'var(--bg-surface)', border:'1px solid var(--border-subtle)',
            borderRadius:'var(--r-xl)', padding:'32px 32px 28px', boxShadow:'var(--shadow-lg)',
            position:'relative', overflow:'hidden',
          }}>
            {/* Top accent */}
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, var(--amber), transparent)' }} />


            <div style={{ marginBottom:22 }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, marginBottom:4 }}>Operator Sign In</h2>
              <p style={{ fontSize:12, color:'var(--text-muted)' }}>Authorized personnel only. All access is logged.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {/* Email */}
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Email Address</label>
                <div style={{ position:'relative' }}>
                  <svg style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}
                    width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    type="email" value={email} onChange={e=>setEmail(e.target.value)}
                    placeholder="operator@emergency.gov.gh" required autoComplete="username"
                    style={{
                      width:'100%', background:'var(--bg-raised)', border:'1px solid var(--border-subtle)',
                      borderRadius:'var(--r-sm)', padding:'11px 14px 11px 40px',
                      color:'var(--text-primary)', fontSize:13, outline:'none', transition:'all var(--ease-fast)',
                    }}
                    onFocus={e=>{e.target.style.borderColor='var(--amber)';e.target.style.boxShadow='0 0 0 3px var(--amber-soft)';}}
                    onBlur={e=>{e.target.style.borderColor='var(--border-subtle)';e.target.style.boxShadow='none';}}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Password</label>
                <div style={{ position:'relative' }}>
                  <svg style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}
                    width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)}
                    placeholder="••••••••••••••" required autoComplete="current-password"
                    style={{
                      width:'100%', background:'var(--bg-raised)', border:'1px solid var(--border-subtle)',
                      borderRadius:'var(--r-sm)', padding:'11px 42px 11px 40px',
                      color:'var(--text-primary)', fontSize:13, outline:'none', transition:'all var(--ease-fast)',
                    }}
                    onFocus={e=>{e.target.style.borderColor='var(--amber)';e.target.style.boxShadow='0 0 0 3px var(--amber-soft)';}}
                    onBlur={e=>{e.target.style.borderColor='var(--border-subtle)';e.target.style.boxShadow='none';}}
                  />
                  <button type="button" onClick={()=>setShowPass(s=>!s)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                    {showPass
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  marginTop:6, padding:'13px', width:'100%',
                  background: loading ? 'rgba(245,158,11,0.5)' : 'var(--amber)',
                  color:'#000', fontFamily:'var(--font-display)', fontSize:14, fontWeight:800,
                  letterSpacing:'0.1em', borderRadius:'var(--r-sm)', border:'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                  transition:'all var(--ease-fast)',
                  boxShadow: loading ? 'none' : 'var(--shadow-amber)',
                }}
                onMouseEnter={e=>{ if (!loading) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 0 32px rgba(245,158,11,0.5)'; }}}
                onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=loading?'none':'var(--shadow-amber)'; }}
              >
                {loading
                  ? <><span style={{ width:16, height:16, border:'2px solid rgba(0,0,0,0.3)', borderTopColor:'#000', borderRadius:'50%', animation:'spin 0.75s linear infinite', display:'inline-block' }} />AUTHENTICATING...</>
                  : <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    ACCESS COMMAND CENTER
                  </>
                }
              </button>
            </form>

            <div style={{ marginTop:18, fontSize:12, color:'var(--text-secondary)', textAlign:'center' }}>
              Don't have an account? <Link to="/register" style={{ color:'var(--amber)', textDecoration:'none' }}>Register</Link>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop:20, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:12, fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>
            <span>© {new Date().getFullYear()} SwiftAid</span>
            <span style={{ color:'var(--border-normal)' }}>•</span>
            <span>All rights reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
