import { useState, useEffect } from 'react';
import { authApi } from '../api';
import { PageHeader, Card, DataTable, Btn, Modal, Field, Input, Select, Spinner } from '../components/UI';
import { USER_ROLES, ROLE_COLORS, getRoleLabel, fmtDate } from '../utils/constants';
import { UserPlus, ShieldAlert, Building2, Shield, Flame, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_ICONS = {
  SYSTEM_ADMIN:   <ShieldAlert size={12} strokeWidth={2} />,
  HOSPITAL_ADMIN: <Building2  size={12} strokeWidth={2} />,
  POLICE_ADMIN:   <Shield     size={12} strokeWidth={2} />,
  FIRE_ADMIN:     <Flame      size={12} strokeWidth={2} />,
};

export default function Users() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(false);
  const [saving, setSaving]       = useState(false);
  const [toggling, setToggling]   = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, user: null, activate: false });
  const [form, setForm]           = useState({ name: '', email: '', password: '', role: 'SYSTEM_ADMIN' });

  const load = () => {
    setLoading(true);
    authApi.listUsers()
      .then(r => setUsers(r.data || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = (u) => {
    const activate = !(u.enabled ?? true);
    setConfirmModal({ open: true, user: u, activate });
  };

  const handleConfirmToggle = async () => {
    const { user: u, activate } = confirmModal;
    setConfirmModal({ open: false, user: null, activate: false });
    setToggling(u.userId || u.id);
    try {
      if (activate) await authApi.activateUser(u.userId || u.id);
      else          await authApi.deactivateUser(u.userId || u.id);
      toast.success(`${u.name} ${activate ? 'activated' : 'deactivated'}`);
      load();
    } catch { toast.error('Failed to update user status'); }
    finally { setToggling(null); }
  };

  const handleCreate = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.role) { toast.error('Please fill all required fields'); return; }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) { toast.error('Please enter a valid email address'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await authApi.register(form);
      toast.success('User registered successfully');
      setModal(false);
      setForm({ name: '', email: '', password: '', role: 'SYSTEM_ADMIN' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally { setSaving(false); }
  };

  const displayed = users.filter(u => {
    if (filterRole && u.role !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    }
    return true;
  });

  // Role summary counts
  const roleCounts = USER_ROLES.map(r => ({ ...r, count: users.filter(u => u.role === r.value).length }));

  const cols = [
    {
      key: 'name', label: 'User',
      render: (v, row) => {
        const color = ROLE_COLORS[row.role] || 'var(--text-muted)';
        const initials = v?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: `color-mix(in srgb, ${color} 18%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role', label: 'Role',
      render: (v) => {
        const color = ROLE_COLORS[v] || 'var(--text-muted)';
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 'var(--r-full)', fontSize: 10, fontWeight: 700, color, background: `color-mix(in srgb, ${color} 13%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 28%, transparent)` }}>
            {ROLE_ICONS[v]}{getRoleLabel(v)}
          </span>
        );
      },
    },
    {
      key: 'createdDate', label: 'Joined', w: 130,
      render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(v)}</span>,
    },
    {
      key: 'enabled', label: 'Status', w: 100, sortable: false,
      render: (v, row) => {
        const isEnabled = v !== false; // default true if field missing
        const uid = row.userId || row.id;
        const isToggling = toggling === uid;
        return (
          <button onClick={e => { e.stopPropagation(); handleToggle(row); }} disabled={isToggling}
            style={{ display: 'flex', alignItems: 'center', gap: 5, color: isEnabled ? 'var(--color-success)' : 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}
            title={isEnabled ? 'Click to deactivate' : 'Click to activate'}>
            {isEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
            {isEnabled ? 'Active' : 'Inactive'}
          </button>
        );
      },
    },
  ];

  if (loading) return <Spinner />;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <PageHeader
        title="User Management"
        subtitle={`${users.length} registered operators`}
        actions={<Btn icon={<UserPlus size={14} />} onClick={() => setModal(true)}>Add User</Btn>}
      />

      {/* Role filter cards */}
      <div className="mob-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {roleCounts.map(r => {
          const color = ROLE_COLORS[r.value];
          const isActive = filterRole === r.value;
          return (
            <button key={r.value} onClick={() => setFilterRole(isActive ? '' : r.value)}
              style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', border: `1px solid ${isActive ? color : 'var(--border-subtle)'}`, background: isActive ? `color-mix(in srgb, ${color} 10%, transparent)` : 'var(--bg-surface)', cursor: 'pointer', textAlign: 'left', transition: 'all var(--ease-fast)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: isActive ? color : 'var(--text-primary)', lineHeight: 1 }}>{r.count}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{r.label}</div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
          style={{ width: '100%', maxWidth: 300, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)', padding: '8px 12px', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
          onFocus={e => e.target.style.borderColor = 'var(--color-brand)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
        />
      </div>

      <Card style={{ padding: 0 }}>
        <DataTable cols={cols} rows={displayed} emptyTitle="No users found" emptyMsg="Try adjusting your search or role filter." />
      </Card>

      {/* Confirm activate/deactivate modal */}
      <Modal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, user: null, activate: false })}
        title={confirmModal.activate ? 'Activate User' : 'Deactivate User'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--r-sm)', flexShrink: 0,
              background: confirmModal.activate ? 'var(--success-soft)' : 'var(--danger-soft)',
              border: `1px solid ${confirmModal.activate ? 'var(--success-border)' : 'var(--danger-border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {confirmModal.activate
                ? <ToggleRight size={20} color="var(--color-success)" />
                : <ToggleLeft  size={20} color="var(--color-danger)"  />}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                {confirmModal.activate ? 'Activate' : 'Deactivate'} <span style={{ color: confirmModal.activate ? 'var(--color-success)' : 'var(--color-danger)' }}>{confirmModal.user?.name}</span>?
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {confirmModal.activate
                  ? 'This user will be able to log in and access the system.'
                  : 'This user will be immediately signed out and blocked from logging in.'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" type="button" onClick={() => setConfirmModal({ open: false, user: null, activate: false })}>Cancel</Btn>
            <Btn
              type="button"
              onClick={handleConfirmToggle}
              style={confirmModal.activate ? {} : { background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
            >
              {confirmModal.activate ? 'Activate' : 'Deactivate'}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Add user modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Register New User">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Full Name" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" autoFocus />
          </Field>
          <Field label="Email Address" required>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@emergency.gov.gh" />
          </Field>
          <Field label="Password" required>
            <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Minimum 8 characters" />
          </Field>
          <Field label="Role" required>
            <Select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {USER_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          </Field>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Btn variant="secondary" type="button" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn type="submit" loading={saving}>Register User</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
