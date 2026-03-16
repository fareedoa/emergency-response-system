import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentApi } from '../api';
import { PageHeader, Btn, DataTable, StatusBadge, SeverityBadge, TypeBadge, Card } from '../components/UI';
import { INCIDENT_TYPES, SEVERITY_LEVELS, INCIDENT_STATUSES, fmtDateTime, timeAgo } from '../utils/constants';

const MOCK = [
  { id:'inc-001', citizenName:'Kwame Mensah',  incidentType:'MEDICAL_EMERGENCY', severity:'CRITICAL', status:'DISPATCHED',  latitude:5.6037,  longitude:-0.1870, createdAt: new Date(Date.now()-8*60000).toISOString(),    assignedUnit:'unit-a1' },
  { id:'inc-002', citizenName:'Abena Osei',    incidentType:'FIRE',              severity:'HIGH',     status:'IN_PROGRESS', latitude:5.5502,  longitude:-0.2174, createdAt: new Date(Date.now()-22*60000).toISOString(),   assignedUnit:'unit-b2' },
  { id:'inc-003', citizenName:'Kofi Asante',   incidentType:'CRIME',             severity:'HIGH',     status:'CREATED',     latitude:5.5580,  longitude:-0.1802, createdAt: new Date(Date.now()-35*60000).toISOString(),   assignedUnit:null },
  { id:'inc-004', citizenName:'Ama Darkwa',    incidentType:'ACCIDENT',          severity:'CRITICAL', status:'DISPATCHED',  latitude:5.6698,  longitude:-0.0166, createdAt: new Date(Date.now()-47*60000).toISOString(),   assignedUnit:'unit-c3' },
  { id:'inc-005', citizenName:'Yaw Boateng',   incidentType:'ROBBERY',           severity:'MEDIUM',   status:'RESOLVED',    latitude:5.5480,  longitude:-0.2190, createdAt: new Date(Date.now()-2*3600000).toISOString(),  assignedUnit:'unit-d4' },
  { id:'inc-006', citizenName:'Efua Mensah',   incidentType:'MEDICAL_EMERGENCY', severity:'HIGH',     status:'RESOLVED',    latitude:6.6885,  longitude:1.6244,  createdAt: new Date(Date.now()-3*3600000).toISOString(),  assignedUnit:'unit-e5' },
  { id:'inc-007', citizenName:'Nana Adjei',    incidentType:'FIRE',              severity:'LOW',      status:'RESOLVED',    latitude:4.8989,  longitude:-1.7577, createdAt: new Date(Date.now()-5*3600000).toISOString(),  assignedUnit:'unit-f6' },
  { id:'inc-008', citizenName:'Akosua Darko',  incidentType:'CRIME',             severity:'MEDIUM',   status:'CREATED',     latitude:5.5480,  longitude:-0.2190, createdAt: new Date(Date.now()-10*60000).toISOString(),   assignedUnit:null },
  { id:'inc-009', citizenName:'Kojo Amponsah', incidentType:'MEDICAL_EMERGENCY', severity:'HIGH',     status:'IN_PROGRESS', latitude:6.6870,  longitude:1.6230,  createdAt: new Date(Date.now()-90*60000).toISOString(),   assignedUnit:'unit-g7' },
  { id:'inc-010', citizenName:'Adwoa Sarpong', incidentType:'ACCIDENT',          severity:'LOW',      status:'RESOLVED',    latitude:7.3349,  longitude:-2.3284, createdAt: new Date(Date.now()-6*3600000).toISOString(),  assignedUnit:'unit-h8' },
];

export default function Incidents() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState(MOCK);
  const [loading] = useState(false);
  const [filter, setFilter] = useState({ status:'', type:'', severity:'' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    incidentApi.list().then(r => { if (r.data?.length) setIncidents(r.data); }).catch(()=>{});
  }, []);

  const filtered = incidents.filter(i => {
    if (filter.status && i.status !== filter.status) return false;
    if (filter.type && i.incidentType !== filter.type) return false;
    if (filter.severity && i.severity !== filter.severity) return false;
    if (search && !i.citizenName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const cols = [
    { key:'incidentType', label:'Type', w:130, render:(v) => <TypeBadge type={v} /> },
    { key:'citizenName', label:'Citizen', render:(v,row) => (
      <div>
        <div style={{ fontWeight:600, fontSize:13 }}>{v}</div>
        <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)', marginTop:2 }}>{row.id?.slice(0,8)}...</div>
      </div>
    )},
    { key:'severity',    label:'Severity', w:110, render:(v) => <SeverityBadge severity={v} /> },
    { key:'status',      label:'Status',   w:130, render:(v) => <StatusBadge status={v} /> },
    { key:'latitude',    label:'Location', w:180, render:(v,row) => <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>{v?.toFixed(4)}, {row.longitude?.toFixed(4)}</span> },
    { key:'createdAt',   label:'Reported', w:150, render:(v) => <div><div style={{ fontSize:12 }}>{fmtDateTime(v)}</div><div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{timeAgo(v)}</div></div> },
  ];

  const statsBar = [
    { label:'Total',       val:incidents.length,                                         color:'var(--text-secondary)' },
    { label:'Open',        val:incidents.filter(i=>i.status!=='RESOLVED').length,        color:'var(--amber)' },
    { label:'Dispatched',  val:incidents.filter(i=>i.status==='DISPATCHED').length,      color:'var(--cyan)' },
    { label:'In Progress', val:incidents.filter(i=>i.status==='IN_PROGRESS').length,     color:'var(--orange)' },
    { label:'Resolved',    val:incidents.filter(i=>i.status==='RESOLVED').length,        color:'var(--green)' },
  ];

  const selStyle = { background:'var(--bg-raised)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-sm)', padding:'9px 34px 9px 14px', color:'var(--text-muted)', fontSize:12, outline:'none', cursor:'pointer', appearance:'none', minWidth:140, backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237B92B8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center' };

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <PageHeader title="Incidents" subtitle={`${filtered.length} of ${incidents.length} records`}
        actions={<Btn onClick={() => navigate('/incidents/new')} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>LOG INCIDENT</Btn>}
      />

      <Card style={{ padding:'14px 24px', marginBottom:20 }}>
        <div style={{ display:'flex', gap:32, flexWrap:'wrap' }}>
          {statsBar.map(s => (
            <div key={s.label} style={{ display:'flex', alignItems:'baseline', gap:8 }}>
              <span style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:s.color }}>{s.val}</span>
              <span style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom:20, padding:'16px 20px' }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by citizen name..."
              style={{ width:'100%', background:'var(--bg-raised)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-sm)', padding:'9px 14px 9px 38px', color:'var(--text-primary)', fontSize:13, outline:'none' }}
              onFocus={e=>e.target.style.borderColor='var(--amber)'} onBlur={e=>e.target.style.borderColor='var(--border-subtle)'}
            />
          </div>
          <select value={filter.status} onChange={e=>setFilter(p=>({...p,status:e.target.value}))} style={selStyle} onFocus={e=>e.target.style.borderColor='var(--amber)'} onBlur={e=>e.target.style.borderColor='var(--border-subtle)'}>
            <option value="">All Statuses</option>
            {INCIDENT_STATUSES.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filter.type} onChange={e=>setFilter(p=>({...p,type:e.target.value}))} style={selStyle} onFocus={e=>e.target.style.borderColor='var(--amber)'} onBlur={e=>e.target.style.borderColor='var(--border-subtle)'}>
            <option value="">All Types</option>
            {INCIDENT_TYPES.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filter.severity} onChange={e=>setFilter(p=>({...p,severity:e.target.value}))} style={selStyle} onFocus={e=>e.target.style.borderColor='var(--amber)'} onBlur={e=>e.target.style.borderColor='var(--border-subtle)'}>
            <option value="">All Severities</option>
            {SEVERITY_LEVELS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {(filter.status||filter.type||filter.severity||search) && <Btn variant="ghost" size="sm" onClick={()=>{setFilter({status:'',type:'',severity:''});setSearch('');}}>Clear</Btn>}
        </div>
      </Card>

      <Card style={{ padding:0 }}>
        <DataTable cols={cols} rows={filtered} onRowClick={row=>navigate(`/incidents/${row.id}`)} loading={loading} emptyTitle="No incidents found" emptyIcon="🚨" />
      </Card>
    </div>
  );
}
