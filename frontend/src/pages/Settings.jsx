import { useState } from 'react';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PageHeader, Card, SectionTitle, Field, Input, Btn } from '../components/UI';
import {
  Lock, Palette, ShieldCheck, Sun, Moon, Contrast,
  CheckCircle, Building2, Shield, Flame
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_LABELS = {
  SYSTEM_ADMIN:   { label: 'System Administrator', Icon: ShieldCheck, color: 'var(--color-brand)' },
  HOSPITAL_ADMIN: { label: 'Hospital Administrator', Icon: Building2,  color: 'var(--color-success)' },
  POLICE_ADMIN:   { label: 'Police Administrator',   Icon: Shield,     color: 'var(--color-dispatch)' },
  FIRE_ADMIN:     { label: 'Fire Administrator',     Icon: Flame,      color: 'var(--color-danger)' },
};

const THEMES = [
  { key: 'dark',          Icon: Moon,     label: 'Dark',          sub: 'Deep slate — default' },
  { key: 'light',         Icon: Sun,      label: 'Light',         sub: 'Clean white interface' },
  { key: 'high-contrast', Icon: Contrast, label: 'High Contrast', sub: 'Maximum accessibility' },
];

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  const roleInfo = ROLE_LABELS[user?.role] || {};
  const RoleIcon = roleInfo.Icon;

  // ✅ FIXED validation logic
  const passwordsMismatch =
    pwd.confirm.length > 0 && pwd.next !== pwd.confirm;

  const handleProfileSave = async e => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name cannot be empty');

    setSavingProfile(true);
    try {
      await authApi.updateProfile({ name: name.trim() });

      const stored = JSON.parse(localStorage.getItem('swiftaid_user') || '{}');
      localStorage.setItem(
        'swiftaid_user',
        JSON.stringify({ ...stored, name: name.trim() })
      );

      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async e => {
    e.preventDefault();

    if (!pwd.current) return toast.error('Current password is required');
    if (pwd.next.length < 8) return toast.error('New password must be at least 8 characters');
    if (passwordsMismatch) return toast.error('Passwords do not match');

    setSavingPwd(true);
    try {
      await authApi.updatePassword({
        currentPassword: pwd.current,
        newPassword: pwd.next
      });

      toast.success('Password changed successfully');
      setPwd({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div style={{ animation: 'fadeUp 0.3s ease', maxWidth: 720, margin: '0 auto' }}>
      <PageHeader title="Settings" subtitle="Manage your profile, security, and display preferences" />

      {/* Account */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>Account</SectionTitle>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 0',
          borderBottom: '1px solid var(--border-faint)',
          marginBottom: 20
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 'var(--r-md)',
            background: `color-mix(in srgb, ${roleInfo.color || 'var(--color-brand)'} 18%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 800,
            color: roleInfo.color || 'var(--color-brand)'
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{user?.name}</div>
            <div style={{ fontSize: 12 }}>{user?.email}</div>
          </div>

          {RoleIcon && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: '999px',
              color: roleInfo.color
            }}>
              <RoleIcon size={13} />
              {roleInfo.label}
            </div>
          )}
        </div>

        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Display Name" required>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </Field>

          <Field label="Email Address">
            <Input value={user?.email || ''} disabled />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn type="submit" loading={savingProfile} icon={<CheckCircle size={14} />}>
              Save Profile
            </Btn>
          </div>
        </form>
      </Card>

      {/* Password */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>
          <span style={{ display: 'flex', gap: 8 }}>
            <Lock size={13} /> Change Password
          </span>
        </SectionTitle>

        <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Current Password" required>
            <Input
              type="password"
              value={pwd.current}
              onChange={e => setPwd(p => ({ ...p, current: e.target.value }))}
            />
          </Field>

          <div className="mob-1col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="New Password" required>
              <Input
                type="password"
                value={pwd.next}
                onChange={e => setPwd(p => ({ ...p, next: e.target.value }))}
              />
            </Field>

            <Field label="Confirm Password" required>
              <Input
                type="password"
                value={pwd.confirm}
                onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
                className={passwordsMismatch ? 'input-error' : ''}
              />
            </Field>
          </div>

          {passwordsMismatch && (
            <div style={{ color: 'var(--color-danger)', fontSize: 12 }}>
              Passwords do not match
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn
              type="submit"
              loading={savingPwd}
              icon={<Lock size={14} />}
              disabled={passwordsMismatch}
            >
              Change Password
            </Btn>
          </div>
        </form>
      </Card>

      {/* Theme */}
      <Card>
        <SectionTitle>
          <span style={{ display: 'flex', gap: 8 }}>
            <Palette size={13} /> Theme
          </span>
        </SectionTitle>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {THEMES.map(t => (
            <button key={t.key} onClick={() => setTheme(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}