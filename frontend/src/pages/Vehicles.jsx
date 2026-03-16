import { useState, useEffect } from 'react';
import { trackingApi } from '../api';
import { PageHeader, Card, Btn, DataTable, VehicleStatusBadge, Modal, Field, Input, Select, SectionTitle } from '../components/UI';
import { VEHICLE_TYPES, STATION_TYPES, fmtDateTime } from '../utils/constants';
import toast from 'react-hot-toast';

const MOCK = [
  { id:'v1', registration:'GR-1234-22', vehicleType:'AMBULANCE',   status:'EN_ROUTE',   currentLat:5.6037, currentLng:-0.1870, stationType:'HOSPITAL',        stationId:'st-001', activeIncidentId:'inc-001', updatedAt: new Date(Date.now()-3*60000).toISOString() },
  { id:'v2', registration:'GR-5678-22', vehicleType:'POLICE_CAR',  status:'ON_SCENE',   currentLat:5.5502, currentLng:-0.2174, stationType:'POLICE_STATION',  stationId:'st-002', activeIncidentId:'inc-002', updatedAt: new Date(Date.now()-7*60000).toISOString() },
  { id:'v3', registration:'GR-9012-22', vehicleType:'FIRE_TRUCK',  status:'IDLE',       currentLat:5.5480, currentLng:-0.2190, stationType:'FIRE_STATION',    stationId:'st-003', activeIncidentId:null,      updatedAt: new Date(Date.now()-15*60000).toISOString() },
  { id:'v4', registration:'GR-3456-22', vehicleType:'AMBULANCE',   status:'IDLE',       currentLat:6.6885, currentLng:1.6244,  stationType:'HOSPITAL',        stationId:'st-004', activeIncidentId:null,      updatedAt: new Date(Date.now()-20*60000).toISOString() },
  { id:'v5', registration:'GR-7890-22', vehicleType:'PATROL_BIKE', status:'RETURNING',  currentLat:4.8989, currentLng:-1.7577, stationType:'POLICE_STATION',  stationId:'st-005', activeIncidentId:null,      updatedAt: new Date(Date.now()-5*60000).toISOString() },
  { id:'v6', registration:'GR-2345-22', vehicleType:'POLICE_CAR',  status:'IDLE',       currentLat:5.6698, currentLng:-0.0166, stationType:'POLICE_STATION',  stationId:'st-006', activeIncidentId:null,      updatedAt: new Date(Date.now()-30*60000).toISOString() },
  { id:'v7', registration:'AS-1111-23', vehicleType:'FIRE_TRUCK',  status:'DISPATCHED', currentLat:6.6870, currentLng:1.6230,  stationType:'FIRE_STATION',    stationId:'st-007', activeIncidentId:'inc-003',  updatedAt: new Date(Date.now()-2*60000).toISOString() },
  { id:'v8', registration:'KS-4567-23', vehicleType:'AMBULANCE',   status:'IDLE',       currentLat:6.6900, currentLng:1.6200,  stationType:'HOSPITAL',        stationId:'st-008', activeIncidentId:null,      updatedAt: new Date(Date.now()-45*60000).toISOString() },
];

export default function Vehicles() {
  const [vehicles, setVehicles] = useState(MOCK);
  const [loading] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ registration:'', vehicleType:'', stationId:'', stationType:'' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    trackingApi.listVehicles().then(r=>{ if(r.data?.length) setVehicles(r.data); }).catch(()=>{});
  }, []);

  const filtered = vehicles.filter(v => {
    if (filterType && v.vehicleType !== filterType) return false;
    if (filterStatus && v.status !== filterStatus) return false;
    return true;
  });

  const validate = () => {
    const e = {};
    if (!form.registration.trim()) e.registration = 'Required';
    if (!form.vehicleType) e.vehicleType = 'Required';
    if (!form.stationId.trim()) e.stationId = 'Required';
    if (!form.stationType) e.stationType = 'Required';
    return e;
  };

  const handleRegister = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await trackingApi.registerVehicle({ registration:form.registration.toUpperCase(), vehicleType:form.vehicleType, stationId:form.stationId, stationType:form.stationType });
      toast.success('Vehicle registered');
      setModal(false);
      setForm({ registration:'', vehicleType:'', stationId:'', stationType:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed — backend not connected (preview mode)');
    } finally { setSubmitting(false); }
  };

  const byType = VEHICLE_TYPES.map(t => ({ ...t, count: vehicles.filter(v=>v.vehicleType===t.value).length }));
  const active = vehicles.filter(v=>v.status!=='IDLE').length;

  const cols = [
    { key:'vehicleType', label:'Type', w:60, render:(v) => <div style={{ display:'flex', alignItems:'center', gap:8 }}><span style={{ fontSize:20 }}>{VEHICLE_TYPES.find(t=>t.value===v)?.icon||'🚗'}</span><span style={{ fontSize:12, color:'var(--text-secondary)' }}>{v?.replace('_',' ')}</span></div> },
    { key:'registration', label:'Registration', render:(v) => <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:13, color:'var(--amber)', letterSpacing:'0.05em' }}>{v}</span> },
    { key:'status', label:'Status', w:130, render:(v) => <VehicleStatusBadge status={v} /> },
    { key:'stationType', label:'Station', w:160, render:(v) => <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{v?.replace('_',' ')}</span> },
    { key:'currentLat', label:'GPS Location', w:180, render:(v,row) => v ? <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>{v?.toFixed(4)}, {row.currentLng?.toFixed(4)}</span> : <span style={{ color:'var(--text-muted)', fontSize:12 }}>No GPS</span> },
    { key:'activeIncidentId', label:'Incident', w:120, render:(v) => v ? <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--cyan)' }}>{v.slice(0,10)}...</span> : <span style={{ color:'var(--text-muted)', fontSize:12 }}>—</span> },
    { key:'updatedAt', label:'Updated', w:140, render:(v) => <span style={{ fontSize:11, color:'var(--text-muted)' }}>{fmtDateTime(v)}</span> },
  ];

  const tagBtn = (label, active_, onClick) => (
    <button onClick={onClick} style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600, border:'1px solid', borderColor:active_?'var(--amber)':'var(--border-subtle)', background:active_?'var(--amber-soft)':'transparent', color:active_?'var(--amber)':'var(--text-secondary)', cursor:'pointer', transition:'all var(--ease-fast)' }}>{label}</button>
  );

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <PageHeader title="Fleet Management" subtitle={`${vehicles.length} registered vehicles · ${active} active`}
        actions={<Btn onClick={()=>setModal(true)} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>Register Vehicle</Btn>}
      />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:14, marginBottom:20 }}>
        {byType.map(t => (
          <Card key={t.value} style={{ padding:'16px 20px', cursor:'pointer', transition:'all var(--ease-fast)', borderColor:filterType===t.value?'var(--amber-border)':'var(--border-subtle)' }} onClick={()=>setFilterType(filterType===t.value?'':t.value)}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:24 }}>{t.icon}</span>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:'var(--amber)', lineHeight:1 }}>{t.count}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:2 }}>{t.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom:16, padding:'14px 18px' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em' }}>Filter:</span>
          {VEHICLE_TYPES.map(t => tagBtn(`${t.icon} ${t.label}`, filterType===t.value, ()=>setFilterType(filterType===t.value?'':t.value)))}
          <div style={{ width:1, height:20, background:'var(--border-subtle)' }} />
          {['IDLE','EN_ROUTE','ON_SCENE','RETURNING','DISPATCHED'].map(s => tagBtn(s.replace('_',' '), filterStatus===s, ()=>setFilterStatus(filterStatus===s?'':s)))}
          {(filterType||filterStatus) && <Btn variant="ghost" size="sm" onClick={()=>{setFilterType('');setFilterStatus('');}}>Clear</Btn>}
        </div>
      </Card>

      <Card style={{ padding:0 }}>
        <DataTable cols={cols} rows={filtered} loading={loading} emptyTitle="No vehicles registered" emptyIcon="🚗" />
      </Card>

      <Modal open={modal} onClose={()=>{setModal(false);setErrors({});}} title="Register New Vehicle">
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <Field label="Registration Number" required error={errors.registration} hint="Vehicle licence plate">
            <Input value={form.registration} onChange={e=>setForm(f=>({...f,registration:e.target.value.toUpperCase()}))} placeholder="e.g. GR-1234-22" style={{ textTransform:'uppercase', fontFamily:'var(--font-mono)', fontWeight:700 }} />
          </Field>
          <Field label="Vehicle Type" required error={errors.vehicleType}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
              {VEHICLE_TYPES.map(t => (
                <button key={t.value} type="button" onClick={()=>{setForm(f=>({...f,vehicleType:t.value}));setErrors(e=>({...e,vehicleType:''}));}}
                  style={{ padding:'10px', borderRadius:'var(--r-sm)', border:'2px solid', borderColor:form.vehicleType===t.value?'var(--amber)':'var(--border-subtle)', background:form.vehicleType===t.value?'var(--amber-soft)':'var(--bg-raised)', color:form.vehicleType===t.value?'var(--amber)':'var(--text-secondary)', cursor:'pointer', textAlign:'center', transition:'all var(--ease-fast)', fontSize:12, fontWeight:600 }}>
                  <div style={{ fontSize:22, marginBottom:4 }}>{t.icon}</div>{t.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Station Type" required error={errors.stationType}>
            <Select value={form.stationType} onChange={e=>{setForm(f=>({...f,stationType:e.target.value}));setErrors(er=>({...er,stationType:''}));}}>
              <option value="">Select station type...</option>
              {STATION_TYPES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </Field>
          <Field label="Station ID" required error={errors.stationId} hint="UUID of the owning station">
            <Input value={form.stationId} onChange={e=>{setForm(f=>({...f,stationId:e.target.value}));setErrors(er=>({...er,stationId:''}));}} placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" style={{ fontFamily:'var(--font-mono)', fontSize:12 }} />
          </Field>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:8 }}>
            <Btn variant="secondary" onClick={()=>{setModal(false);setErrors({});}}>Cancel</Btn>
            <Btn onClick={handleRegister} loading={submitting}>Register Vehicle</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
