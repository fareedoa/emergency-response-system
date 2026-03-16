import { useState, useEffect } from 'react';
import { authApi } from '../api';
import { PageHeader, Card, Btn, DataTable, Modal, Field, Input, Select, SectionTitle } from '../components/UI';
import { USER_ROLES, getRoleLabel, fmtDateTime } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MOCK_USERS = [
  { id:'u1', name:'Vanessa Ayertey',  email:'admin@emergency.gov.gh',   role:'SYSTEM_ADMIN',  isActive:true,  lastLoginAt: new Date(Date.now()-5*60000).toISOString(),    createdAt: new Date('2026-01-15').toISOString() },
  { id:'u2', name:'Fareed Ahmed',     email:'fareed@emergency.gov.gh',   role:'SYSTEM_ADMIN',  isActive:true,  lastLoginAt: new Date(Date.now()-2*3600000).toISOString(),  createdAt: new Date('2026-01-15').toISOString() },
  { id:'u3', name:'Ama Owusu',        email:'ama@korlebu.gov.gh',        role:'HOSPITAL_ADMIN',isActive:true,  lastLoginAt: new Date(Date.now()-1*3600000).toISOString(),  createdAt: new Date('2026-01-20').toISOString() },
  { id:'u4', name:'Kofi Boateng',     email:'kofi@accrapolice.gov.gh',   role:'POLICE_ADMIN',  isActive:true,  lastLoginAt: new Date(Date.now()-30*60000).toISOString(),   createdAt: new Date('2026-02-01').toISOString() },
  { id:'u5', name:'Akua Mensah',      email:'akua@accrafire.gov.gh',     role:'FIRE_ADMIN',    isActive:true,  lastLoginAt: new Date(Date.now()-4*3600000).toISOString(),  createdAt: new Date('2026-02-05').toISOString() },
  { id:'u6', name:'Kwame Asante',     email:'kwame@kumasihosp.gov.gh',   role:'HOSPITAL_ADMIN',isActive:false, lastLoginAt: new Date(Date.now()-7*86400000).toISOString(), createdAt: new Date('2026-02-10').toISOString() },
];

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(MOCK_USERS);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deactivating, setDeactivating] = useState(null);

  useEffect(() => {
    authApi.listUsers().then(r => { if (r.data?.length) setUsers(r.data); }).catch(() => {});
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!form.role) e.role = 'Role is required';
    return e;
  };

  const handleRegister = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await authApi.register(form);
      toast.success('User registered successfully');
      setModal(false);
      setForm({ name:'', email:'', password:'', role:'' });
      setErrors({});
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register user');
    } finally { setSubmitting(false); }
  };

  const handleDeactivate = async (id) => {
    setDeactivating(id);
    try {
      await authApi.deactivateUser(id);
      toast.success('User deactivated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate user');
    } finally { setDeactivating(null); }
  };

  const roleColors = { SYSTEM_ADMIN:'var(--amber)', HOSPITAL_ADMIN:'var(--green)', POLICE_ADMIN:'var(--cyan)', FIRE_ADMIN:'var(--orange)' };

  const cols = [
    { key:'name', label:'Name', render:(v,row) => (
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:32, height:32, borderRadius:'var(--r-sm)',
          background: `${roleColors[row.role] || 'var(--text-muted)'}20`,
          border: `1px solid ${roleColors[row.role] || 'var(--border-subtle)'}40`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--font-display)', fontWeight:800, fontSize:14,
          color: roleColors[row.role] || 'var(--text-secondary)', flexShrink:0,
        }}>
          {v?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)' }}>{v}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{row.email}</div>
        </div>
      </div>
    )},
    { key:'role', label:'Role', w:200, render:(v) => {
      const color = roleColors[v] || 'var(--text-muted)';
      return (
        <span style={{ fontSize:11, fontWeight:700, color, background:`${color}15`, border:`1px solid ${color}30`, padding:'3px 10px', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.08em' }}>
          {getRoleLabel(v)}
        </span>
      );
    }},
    { key:'isActive', label:'Status', w:100, render:(v) => (
      <span style={{
        fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.08em',
        color: v === false ? 'var(--red)' : 'var(--green)',
        background: v === false ? 'var(--red-soft)' : 'var(--green-soft)',
        border: `1px solid ${v === false ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
      }}>
        {v === false ? 'Inactive' : 'Active'}
      </span>
    )},
    { key:'lastLoginAt', label:'Last Login', w:170, render:(v) => <span style={{ fontSize:12, color:'var(--text-muted)' }}>{v ? fmtDateTime(v) : 'Never'}</span> },
    { key:'createdAt', label:'Joined', w:140, render:(v) => <span style={{ fontSize:12, color:'var(--text-muted)' }}>{fmtDateTime(v)}</span> },
    { key:'id', label:'', w:80, render:(v, row) => (
      row.id !== currentUser?.id && row.isActive !== false ? (
        <Btn variant="danger" size="sm" loading={deactivating === v} onClick={(e) => { e.stopPropagation(); handleDeactivate(v); }}>
          Deactivate
        </Btn>
      ) : null
    )},
  ];

  const roleCounts = USER_ROLES.map(r => ({ ...r, count: users.filter(u=>u.role===r.value).length, color: roleColors[r.value] }));

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <PageHeader
        title="User Management"
        subtitle={`${users.length} registered operators`}
        actions={
          <Btn onClick={() => setModal(true)}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
          >
            Register Operator
          </Btn>
        }
      />

      {/* Role breakdown */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:14, marginBottom:20 }}>
        {roleCounts.map(r => (
          <Card key={r.value} style={{ padding:'16px 20px' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:r.color, lineHeight:1 }}>{loading ? '—' : r.count}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:4 }}>{r.label.replace(' Administrator','').replace(' Admin','')}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding:0 }}>
        <DataTable
          cols={cols}
          rows={users}
          loading={loading}
          emptyTitle="No users registered"
          emptyIcon="👤"
        />
      </Card>

      {/* Register modal */}
      <Modal open={modal} onClose={() => { setModal(false); setErrors({}); }} title="Register New Operator">
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Field label="Full Name" required error={errors.name}>
            <Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Kwame Mensah" autoFocus />
          </Field>
          <Field label="Email Address" required error={errors.email}>
            <Input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="operator@emergency.gov.gh" />
          </Field>
          <Field label="Password" required error={errors.password} hint="Minimum 6 characters">
            <Input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••••" />
          </Field>
          <Field label="Role" required error={errors.role}>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {USER_ROLES.map(r => {
                const color = roleColors[r.value] || 'var(--text-secondary)';
                return (
                  <button key={r.value} type="button"
                    onClick={() => { setForm(f=>({...f,role:r.value})); setErrors(e=>({...e,role:''})); }}
                    style={{
                      padding:'11px 14px', borderRadius:'var(--r-sm)', border:'2px solid', textAlign:'left', cursor:'pointer',
                      borderColor: form.role===r.value ? color : 'var(--border-subtle)',
                      background: form.role===r.value ? `${color}12` : 'var(--bg-raised)',
                      color: form.role===r.value ? color : 'var(--text-secondary)',
                      fontSize:13, fontWeight:600, transition:'all var(--ease-fast)',
                    }}>
                    {r.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:8 }}>
            <Btn variant="secondary" onClick={() => { setModal(false); setErrors({}); }}>Cancel</Btn>
            <Btn onClick={handleRegister} loading={submitting}>Register Operator</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
