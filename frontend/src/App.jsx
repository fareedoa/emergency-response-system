import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Incidents from './pages/Incidents';
import NewIncident from './pages/NewIncident';
import IncidentDetail from './pages/IncidentDetail';
import Tracking from './pages/Tracking';
import Vehicles from './pages/Vehicles';
import Analytics from './pages/Analytics';
import Users from './pages/Users';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-normal)',
              borderRadius: 'var(--r-md)',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              boxShadow: 'var(--shadow-lg)',
            },
            success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--bg-void)' } },
            error:   { iconTheme: { primary: 'var(--red)',   secondary: 'var(--bg-void)' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/incidents/new" element={
              <ProtectedRoute roles={['SYSTEM_ADMIN','HOSPITAL_ADMIN','POLICE_ADMIN','FIRE_ADMIN']}>
                <NewIncident />
              </ProtectedRoute>
            } />
            <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/users" element={
              <ProtectedRoute roles={['SYSTEM_ADMIN']}>
                <Users />
              </ProtectedRoute>
            } />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-void)', flexDirection:'column', gap:16 }}>
              <div style={{ fontSize:60 }}>404</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:24, color:'var(--text-secondary)' }}>Page Not Found</div>
              <a href="/dashboard" style={{ color:'var(--amber)', fontSize:14 }}>← Return to Dashboard</a>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
