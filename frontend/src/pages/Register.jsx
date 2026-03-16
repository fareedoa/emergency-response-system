import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!name || !email || !password || !confirm) { toast.error('Please fill all fields'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created. Redirecting...');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-void)', display:'flex', position:'relative', overflow:'hidden' }}>
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)',
        backgroundSize:'60px 60px',
      }} />

      <div style={{
        position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:600, height:600, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)',
        pointerEvents:'none',
      }} />

      <div style={{
        position:'absolute', left:0, right:0, height:2,
        background:'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)',
        animation:'scandown 10s ease-in-out infinite', pointerEvents:'none',
      }} />

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ width:'100%', maxWidth:420, animation:'fadeUp 0.5s ease' }}>
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

          <div style={{
            background:'var(--bg-surface)', border:'1px solid var(--border-subtle)',
            borderRadius:'var(--r-xl)', padding:'32px 32px 28px', boxShadow:'var(--shadow-lg)',
            position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, var(--amber), transparent)' }} />

            <div style={{ marginBottom:22 }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, marginBottom:4 }}>Create an Account</h2>
              <p style={{ fontSize:12, color:'var(--text-muted)' }}>Register below to get access. Your account will be activated once approved.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Full Name</label>
                <input
                  type="text" value={name} onChange={e=>setName(e.target.value)}
                  placeholder="Jane Doe" required autoComplete="name"
                  style={{
                    width:'100%', background:'var(--bg-raised)', border:'1px solid var(--border-subtle)',
                    borderRadius:'var(--r-sm)', padding:'11px 14px',
                    color:'var(--text-primary)', fontSize:13, outline:'none', transition:'all var(--ease-fast)',
                  }}
                  onFocus={e=>{e.target.style.borderColor='var(--amber)';e.target.style.boxShadow='0 0 0 3px var(--amber-soft)';}}
                  onBlur={e=>{e.target.style.borderColor='var(--border-subtle)';e.target.style.boxShadow='none';}}
                />
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Email Address</label>
                <input
                  type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="operator@emergency.gov.gh" required autoComplete="username"
                  style={{
                    width:'100%', background:'var(--bg-raised)', border:'1px solid var(--border-subtle)',
                    borderRadius:'var(--r-sm)', padding:'11px 14px',
                    color:'var(--text-primary)', fontSize:13, outline:'none', transition:'all var(--ease-fast)',
                  }}
                  onFocus={e=>{e.target.style.borderColor='var(--amber)';e.target.style.boxShadow='0 0 0 3px var(--amber-soft)';}}
                  onBlur={e=>{e.target.style.borderColor='var(--border-subtle)';e.target.style.boxShadow='none';}}
                />
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)}
                    placeholder="••••••••••••••" required autoComplete="new-password"
                    style={{
                      width:'100%', background:'var(--bg-raised)', border:'1px solid var(--border-subtle)',
                      borderRadius:'var(--r-sm)', padding:'11px 42px 11px 14px',
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

              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Confirm Password</label>
                <input
                  type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
                  placeholder="••••••••••••••" required autoComplete="new-password"
                  style={{
                    width:'100%', background:'var(--bg-raised)', border:'1px solid var(--border-subtle)',
                    borderRadius:'var(--r-sm)', padding:'11px 14px',
                    color:'var(--text-primary)', fontSize:13, outline:'none', transition:'all var(--ease-fast)',
                  }}
                  onFocus={e=>{e.target.style.borderColor='var(--amber)';e.target.style.boxShadow='0 0 0 3px var(--amber-soft)';}}
                  onBlur={e=>{e.target.style.borderColor='var(--border-subtle)';e.target.style.boxShadow='none';}}
                />
              </div>

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
                  ? <><span style={{ width:16, height:16, border:'2px solid rgba(0,0,0,0.3)', borderTopColor:'#000', borderRadius:'50%', animation:'spin 0.75s linear infinite', display:'inline-block' }} />CREATING ACCOUNT...</>
                  : <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 7v5"/><path d="M12 14h.01"/></svg>
                    REGISTER
                  </>
                }
              </button>
            </form>

            <div style={{ marginTop:22, fontSize:12, color:'var(--text-secondary)', textAlign:'center' }}>
              Already have an account? <Link to="/login" style={{ color:'var(--amber)', textDecoration:'none' }}>Sign in</Link>
            </div>
          </div>

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
