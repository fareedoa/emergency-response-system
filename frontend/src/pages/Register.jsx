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
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', password: '', confirm: '', role: '' });

  const handleSubmit = async e => {
    e.preventDefault();
    const newErrs = { name: '', email: '', password: '', confirm: '', role: '' };
    
    if (!name.trim()) newErrs.name = 'Name is required';
    if (!email) newErrs.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) newErrs.email = 'Please enter a valid email address';
    
    if (!role) newErrs.role = 'Role is required';
    
    if (!password) newErrs.password = 'Password is required';
    else if (password.length < 8) newErrs.password = 'Password must be at least 8 characters';
    
    if (password !== confirm) newErrs.confirm = 'Passwords do not match';
    
    if (newErrs.name || newErrs.email || newErrs.password || newErrs.confirm || newErrs.role) {
      setErrors(newErrs);
      return;
    }

    setErrors({ name: '', email: '', password: '', confirm: '', role: '' });
    setLoading(true);
    try {
      await register(name, email, password, role);
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
        backgroundImage:'linear-gradient(var(--grid-overlay) 1px, transparent 1px), linear-gradient(90deg, var(--grid-overlay) 1px, transparent 1px)',
        backgroundSize:'60px 60px',
      }} />

      <div style={{
        position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:600, height:600, borderRadius:'50%',
        background:'radial-gradient(circle, var(--brand-soft) 0%, transparent 70%)',
        pointerEvents:'none',
      }} />

      <div style={{
        position:'absolute', left:0, right:0, height:2,
        background:'linear-gradient(90deg, transparent, var(--brand-glow), transparent)',
        animation:'scandown 10s ease-in-out infinite', pointerEvents:'none',
      }} />

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ width:'100%', maxWidth:420, animation:'fadeUp 0.5s ease' }}>
          <div style={{ marginBottom:40 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
              <div style={{
                width:48, height:48, borderRadius:'var(--r-md)',
                background:'var(--color-brand)', display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'var(--shadow-brand)',
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:26, color:'var(--color-brand)', letterSpacing:'0.12em', lineHeight:1 }}>SwiftAid</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:3 }}>Emergency Response Platform</div>
              </div>
            </div>
          </div>

          <div style={{
            background:'var(--bg-surface)', border:'1px solid var(--border-subtle)',
            borderRadius:'var(--r-xl)', padding:'32px 32px 28px', boxShadow:'var(--shadow-lg)',
            position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, var(--color-brand), transparent)' }} />

            <div style={{ marginBottom:22 }}>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, marginBottom:4 }}>Create an Account</h2>
              <p style={{ fontSize:12, color:'var(--text-muted)' }}>Register below to get access. Your account will be activated once approved.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontSize:11, fontWeight:600, color: errors.name ? 'var(--color-danger)' : 'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Full Name</label>
                <input
                  type="text" value={name} onChange={e=>{setName(e.target.value); if(errors.name) setErrors({...errors, name: ''})}}
                  placeholder="Jane Doe" autoComplete="name"
                  style={{
                    width:'100%', background:'var(--bg-raised)', border: `1px solid ${errors.name ? 'var(--color-danger)' : 'var(--border-subtle)'}`,
                    borderRadius:'var(--r-sm)', padding:'11px 14px',
                    color:'var(--text-primary)', fontSize:13, outline:'none', transition:'all var(--ease-fast)',
                  }}
                  onFocus={e=>{e.target.style.borderColor = errors.name ? 'var(--color-danger)' : 'var(--color-brand)'; e.target.style.boxShadow = errors.name ? '0 0 0 3px color-mix(in srgb, var(--color-danger) 20%, transparent)' : '0 0 0 3px var(--brand-soft)';}}
                  onBlur={e=>{e.target.style.borderColor = errors.name ? 'var(--color-danger)' : 'var(--border-subtle)'; e.target.style.boxShadow='none';}}
                />
                {errors.name && <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 2 }}>{errors.name}</div>}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontSize:11, fontWeight:600, color: errors.email ? 'var(--color-danger)' : 'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Email Address</label>
                <input
                  type="email" value={email} onChange={e=>{setEmail(e.target.value); if(errors.email) setErrors({...errors, email: ''})}}
                  placeholder="operator@emergency.gov.gh" autoComplete="username"
                  style={{
                    width:'100%', background:'var(--bg-raised)', border: `1px solid ${errors.email ? 'var(--color-danger)' : 'var(--border-subtle)'}`,
                    borderRadius:'var(--r-sm)', padding:'11px 14px',
                    color:'var(--text-primary)', fontSize:13, outline:'none', transition:'all var(--ease-fast)',
                  }}
                  onFocus={e=>{e.target.style.borderColor = errors.email ? 'var(--color-danger)' : 'var(--color-brand)'; e.target.style.boxShadow = errors.email ? '0 0 0 3px color-mix(in srgb, var(--color-danger) 20%, transparent)' : '0 0 0 3px var(--brand-soft)';}}
                  onBlur={e=>{e.target.style.borderColor = errors.email ? 'var(--color-danger)' : 'var(--border-subtle)'; e.target.style.boxShadow='none';}}
                />
                {errors.email && <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 2 }}>{errors.email}</div>}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontSize:11, fontWeight:600, color: errors.role ? 'var(--color-danger)' : 'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Agency Role</label>
                <select
                  value={role} onChange={e=>{setRole(e.target.value); if(errors.role) setErrors({...errors, role: ''})}}
                  style={{
                    width:'100%', background:'var(--bg-raised)', border: `1px solid ${errors.role ? 'var(--color-danger)' : 'var(--border-subtle)'}`,
                    borderRadius:'var(--r-sm)', padding:'11px 14px',
                    color:'var(--text-primary)', fontSize:13, outline:'none', transition:'all var(--ease-fast)',
                    appearance:'none',
                  }}
                  onFocus={e=>{e.target.style.borderColor = errors.role ? 'var(--color-danger)' : 'var(--color-brand)'; e.target.style.boxShadow = errors.role ? '0 0 0 3px color-mix(in srgb, var(--color-danger) 20%, transparent)' : '0 0 0 3px var(--brand-soft)';}}
                  onBlur={e=>{e.target.style.borderColor = errors.role ? 'var(--color-danger)' : 'var(--border-subtle)'; e.target.style.boxShadow='none';}}
                >
                  <option value="" disabled>Select your role...</option>
                  <option value="HOSPITAL_ADMIN">Hospital Administrator</option>
                  <option value="POLICE_ADMIN">Police Administrator</option>
                  <option value="FIRE_ADMIN">Fire Service Administrator</option>
                  <option value="SYSTEM_ADMIN">System Administrator</option>
                </select>
                {errors.role && <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 2 }}>{errors.role}</div>}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontSize:11, fontWeight:600, color: errors.password ? 'var(--color-danger)' : 'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e=>{setPassword(e.target.value); if(errors.password) setErrors({...errors, password: ''})}}
                    placeholder="••••••••••••••" autoComplete="new-password"
                    style={{
                      width:'100%', background:'var(--bg-raised)', border: `1px solid ${errors.password ? 'var(--color-danger)' : 'var(--border-subtle)'}`,
                      borderRadius:'var(--r-sm)', padding:'11px 42px 11px 14px',
                      color:'var(--text-primary)', fontSize:13, outline:'none', transition:'all var(--ease-fast)',
                    }}
                    onFocus={e=>{e.target.style.borderColor = errors.password ? 'var(--color-danger)' : 'var(--color-brand)'; e.target.style.boxShadow = errors.password ? '0 0 0 3px color-mix(in srgb, var(--color-danger) 20%, transparent)' : '0 0 0 3px var(--brand-soft)';}}
                    onBlur={e=>{e.target.style.borderColor = errors.password ? 'var(--color-danger)' : 'var(--border-subtle)'; e.target.style.boxShadow='none';}}
                  />
                  <button type="button" onClick={()=>setShowPass(s=>!s)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                    {showPass
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {errors.password && <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 2 }}>{errors.password}</div>}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ fontSize:11, fontWeight:600, color: errors.confirm ? 'var(--color-danger)' : 'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Confirm Password</label>
                <input
                  type="password" value={confirm} onChange={e=>{setConfirm(e.target.value); if(errors.confirm) setErrors({...errors, confirm: ''})}}
                  placeholder="••••••••••••••" autoComplete="new-password"
                  style={{
                    width:'100%', background:'var(--bg-raised)', border: `1px solid ${errors.confirm ? 'var(--color-danger)' : 'var(--border-subtle)'}`,
                    borderRadius:'var(--r-sm)', padding:'11px 14px',
                    color:'var(--text-primary)', fontSize:13, outline:'none', transition:'all var(--ease-fast)',
                  }}
                  onFocus={e=>{e.target.style.borderColor = errors.confirm ? 'var(--color-danger)' : 'var(--color-brand)'; e.target.style.boxShadow = errors.confirm ? '0 0 0 3px color-mix(in srgb, var(--color-danger) 20%, transparent)' : '0 0 0 3px var(--brand-soft)';}}
                  onBlur={e=>{e.target.style.borderColor = errors.confirm ? 'var(--color-danger)' : 'var(--border-subtle)'; e.target.style.boxShadow='none';}}
                />
                {errors.confirm && <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 2 }}>{errors.confirm}</div>}
              </div>

              <button
                type="submit" disabled={loading}
                style={{
                  marginTop:6, padding:'13px', width:'100%',
                  background: loading ? 'var(--brand-dim)' : 'var(--color-brand)',
                  color:'var(--on-brand)', fontFamily:'var(--font-display)', fontSize:14, fontWeight:800,
                  letterSpacing:'0.1em', borderRadius:'var(--r-sm)', border:'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                  transition:'all var(--ease-fast)',
                  boxShadow: loading ? 'none' : 'var(--shadow-brand)',
                }}
                onMouseEnter={e=>{ if (!loading) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 0 32px var(--brand-glow)'; }}}
                onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=loading?'none':'var(--shadow-brand)'; }}
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
              Already have an account? <Link to="/login" style={{ color:'var(--color-brand)', textDecoration:'none' }}>Sign in</Link>
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
