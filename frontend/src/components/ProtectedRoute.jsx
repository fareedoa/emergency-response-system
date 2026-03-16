import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-void)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:36, height:36, border:'3px solid var(--border-subtle)', borderTopColor:'var(--amber)', borderRadius:'50%', animation:'spin 0.75s linear infinite', margin:'0 auto 16px' }} />
          <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)', letterSpacing:'0.1em' }}>LOADING SwiftAid...</div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return (
      <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-void)' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
          <h2 style={{ fontFamily:'var(--font-display)', color:'var(--red)', marginBottom:8 }}>Access Denied</h2>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
}
