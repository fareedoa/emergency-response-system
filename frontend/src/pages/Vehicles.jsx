import { useState, useEffect, useCallback } from 'react';
import { trackingApi } from '../api';
import { PageHeader, Card, DataTable, SectionTitle, Btn, VehicleStatusBadge, Modal, Field, Input, Select, VehicleIcon, Spinner } from '../components/UI';
import { VEHICLE_TYPES, VEHICLE_STATUSES, VEHICLE_STATUS_COLORS, STATION_TYPES, ROLE_STATION } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';






export default function Vehicles() {
  const { user } = useAuth();
  const stationFilter = ROLE_STATION[user?.role];
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ registration: '', vehicleType: '', stationType: '', latitude: '', longitude: '' });

  const load = useCallback(() => {
    setLoading(true);
    trackingApi.listVehicles()
      .then(r => {
        const all = r.data || [];
        setVehicles(stationFilter ? all.filter(v => v.stationType === stationFilter) : all);
      })
      .catch(() => toast.error('Failed to load vehicles'))
      .finally(() => setLoading(false));
  }, [stationFilter]);

  useEffect(() => { load(); }, [load]);


  const filtered = vehicles.filter(v =>
    (!filterType || v.vehicleType === filterType) &&
    (!filterStatus || v.status === filterStatus)
  );

  const typeCounts = VEHICLE_TYPES.reduce((a, t) => {
    a[t.value] = vehicles.filter(v => v.vehicleType === t.value).length;
    return a;
  }, {});
  const statusCounts = VEHICLE_STATUSES.reduce((a, s) => {
    a[s.value] = vehicles.filter(v => v.status === s.value).length;
    return a;
  }, {});

  const handleRegister = async () => {
    if (!form.registration || !form.vehicleType || !form.stationType) { toast.error('Registration, type, and station are required'); return; }
    // Enforce XX-0000-00 or X-0000-00 format
    if (!/^[A-Z]{1,2}-\d{1,4}-\d{2}$/.test(form.registration)) {
      toast.error('Registration must match format: GR-1234-22');
      return;
    }
    setSaving(true);
    try {
      await trackingApi.registerVehicle({
        registration: form.registration, vehicleType: form.vehicleType,
        stationType: form.stationType,
        latitude: parseFloat(form.latitude) || 5.55,
        longitude: parseFloat(form.longitude) || -0.21,
      });
      toast.success('Vehicle registered');
      setModalOpen(false);
      setForm({ registration:'', vehicleType:'', stationType:'', latitude:'', longitude:'' });
      trackingApi.listVehicles().then(r => { if (r.data?.length) setVehicles(r.data); }).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setSaving(false); }
  };

  const selStyle = {
    background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)',
    padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, outline: 'none', cursor: 'pointer',
    appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%237A93BF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 30,
  };

  const cols = [
    { key:'vehicleType',  label:'Type', w:60, render: v => <VehicleIcon type={v} size={18} /> },
    { key:'registration', label:'Registration',        render: (v) => <span style={{ fontFamily:'var(--font-mono)', fontWeight:600, fontSize:13 }}>{v}</span> },
    { key:'vehicleType',  label:'Class',         w:140, sortable:false, render: v => <span style={{ fontSize:12,color:'var(--text-secondary)' }}>{v?.replace('_',' ')}</span> },
    { key:'stationType',  label:'Station',       w:160, render: v => <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{v?.replace('_', ' ')}</span> },
    { key:'status',       label:'Status',        w:130, render: v => <VehicleStatusBadge status={v} /> },
    { key:'currentLat',   label:'GPS',           w:170, sortable:false, render:(v, r) => (
      <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>
        {v?.toFixed(4) || '—'}, {r.currentLng?.toFixed(4) || '—'}
      </span>
    )},
  ];

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <PageHeader
        title="Fleet Management"
        subtitle={`${vehicles.length} registered vehicles`}
        actions={<Btn onClick={() => setModalOpen(true)} icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>Register Vehicle</Btn>}
      />

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:14, marginBottom:22 }}>
        {VEHICLE_TYPES.map(t => (
          <Card key={t.value} style={{ padding:'16px 18px', cursor:'pointer' }}
            onClick={() => setFilterType(filterType === t.value ? '' : t.value)}
            glowColor={filterType === t.value ? 'var(--color-brand)' : undefined}
          >
            <div style={{ fontSize:28, marginBottom:8 }}>{t.icon}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:'var(--color-brand)' }}>{typeCounts[t.value] || 0}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:3 }}>{t.label}</div>
            {filterType === t.value && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:'var(--color-brand)' }} />}
          </Card>
        ))}
      </div>

      {/* Status summary strip */}
      <Card style={{ padding:'12px 20px', marginBottom:20, display:'flex', gap:0, flexWrap:'wrap', overflowX:'auto' }}>
        {VEHICLE_STATUSES.map((s, i) => {
          const color = VEHICLE_STATUS_COLORS[s.value] || 'var(--text-muted)';
          const isActive = filterStatus === s.value;
          return (
            <div key={s.value} style={{ display:'flex', alignItems:'center', flex:1, minWidth:100 }}>
              {i > 0 && <div style={{ width:1, height:40, background:'var(--border-faint)', flexShrink:0 }} />}
              <button onClick={() => setFilterStatus(filterStatus === s.value ? '' : s.value)}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'8px 16px', cursor:'pointer', background:isActive ? `color-mix(in srgb, ${color} 10%, transparent)` : 'transparent', border:'none', borderRadius:'var(--r-sm)', width:'100%' }}>
                <span style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color: statusCounts[s.value] ? color : 'var(--text-muted)' }}>{statusCounts[s.value] || 0}</span>
                <span style={{ fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{s.label}</span>
              </button>
            </div>
          );
        })}
      </Card>

      {/* Filter bar */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selStyle}>
          <option value="">All Types</option>
          {VEHICLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selStyle}>
          <option value="">All Statuses</option>
          {VEHICLE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {(filterType || filterStatus) && (
          <Btn variant="ghost" size="sm" onClick={() => { setFilterType(''); setFilterStatus(''); }}>Clear Filters</Btn>
        )}
        <div style={{ marginLeft:'auto', fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center' }}>{filtered.length} vehicles</div>
      </div>

      <Card style={{ padding:0 }}>
        <DataTable cols={cols} rows={filtered} emptyTitle="No vehicles found" emptyIcon="🚗" />
      </Card>

      {/* Register modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register New Vehicle" maxWidth={480}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Field label="Registration Plate" required>
            <Input value={form.registration} onChange={e => setForm(p => ({...p, registration: e.target.value.toUpperCase()}))} placeholder="GR-0000-00" />
          </Field>
          <Field label="Vehicle Type" required>
            <Select value={form.vehicleType} onChange={e => setForm(p => ({...p, vehicleType: e.target.value}))}>
              <option value="">Select type...</option>
              {VEHICLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </Select>
          </Field>
          <Field label="Assigned Station" required>
            <Select value={form.stationType} onChange={e => setForm(p => ({...p, stationType: e.target.value}))}>
              <option value="">Select station type...</option>
              {STATION_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </Field>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Starting Latitude">
              <Input type="number" value={form.latitude} onChange={e => setForm(p => ({...p, latitude: e.target.value}))} placeholder="e.g. 5.6037" step="any" />
            </Field>
            <Field label="Starting Longitude">
              <Input type="number" value={form.longitude} onChange={e => setForm(p => ({...p, longitude: e.target.value}))} placeholder="e.g. -0.1870" step="any" />
            </Field>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8, borderTop:'1px solid var(--border-faint)', paddingTop:16 }}>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn onClick={handleRegister} loading={saving}>Register</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
