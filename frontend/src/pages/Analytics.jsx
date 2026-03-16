import { useState, useEffect } from 'react';
import { incidentApi, trackingApi } from '../api';
import { PageHeader, Card, StatCard, SectionTitle } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { INCIDENT_TYPES, getTypeInfo } from '../utils/constants';

const MOCK_INC = [
  { id:'i1', incidentType:'MEDICAL_EMERGENCY', severity:'CRITICAL', status:'DISPATCHED',  createdAt: new Date(Date.now()-8*60000).toISOString() },
  { id:'i2', incidentType:'FIRE',              severity:'HIGH',     status:'IN_PROGRESS', createdAt: new Date(Date.now()-22*60000).toISOString() },
  { id:'i3', incidentType:'CRIME',             severity:'HIGH',     status:'CREATED',     createdAt: new Date(Date.now()-35*60000).toISOString() },
  { id:'i4', incidentType:'ACCIDENT',          severity:'CRITICAL', status:'DISPATCHED',  createdAt: new Date(Date.now()-47*60000).toISOString() },
  { id:'i5', incidentType:'ROBBERY',           severity:'MEDIUM',   status:'RESOLVED',    createdAt: new Date(Date.now()-2*3600000).toISOString() },
  { id:'i6', incidentType:'MEDICAL_EMERGENCY', severity:'HIGH',     status:'RESOLVED',    createdAt: new Date(Date.now()-3*3600000).toISOString() },
  { id:'i7', incidentType:'FIRE',              severity:'LOW',      status:'RESOLVED',    createdAt: new Date(Date.now()-5*3600000).toISOString() },
  { id:'i8', incidentType:'CRIME',             severity:'MEDIUM',   status:'CREATED',     createdAt: new Date(Date.now()-10*60000).toISOString() },
  { id:'i9', incidentType:'MEDICAL_EMERGENCY', severity:'HIGH',     status:'IN_PROGRESS', createdAt: new Date(Date.now()-90*60000).toISOString() },
  { id:'i10',incidentType:'ACCIDENT',          severity:'LOW',      status:'RESOLVED',    createdAt: new Date(Date.now()-6*3600000).toISOString() },
];
const MOCK_VEH = [
  { vehicleType:'AMBULANCE',   status:'EN_ROUTE'   },
  { vehicleType:'POLICE_CAR',  status:'ON_SCENE'   },
  { vehicleType:'FIRE_TRUCK',  status:'IDLE'       },
  { vehicleType:'AMBULANCE',   status:'IDLE'       },
  { vehicleType:'PATROL_BIKE', status:'RETURNING'  },
  { vehicleType:'POLICE_CAR',  status:'IDLE'       },
  { vehicleType:'FIRE_TRUCK',  status:'DISPATCHED' },
  { vehicleType:'AMBULANCE',   status:'IDLE'       },
];

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-overlay)', border:'1px solid var(--border-normal)', borderRadius:'var(--r-sm)', padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'var(--text-secondary)', marginBottom:6, fontWeight:600 }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color||'var(--amber)', fontFamily:'var(--font-mono)' }}>{p.name}: {p.value}</div>)}
    </div>
  );
}

export default function Analytics() {
  const [incidents, setIncidents] = useState(MOCK_INC);
  const [vehicles, setVehicles] = useState(MOCK_VEH);

  useEffect(() => {
    incidentApi.list().then(r=>{ if(r.data?.length) setIncidents(r.data); }).catch(()=>{});
    trackingApi.listVehicles().then(r=>{ if(r.data?.length) setVehicles(r.data); }).catch(()=>{});
  }, []);

  const typeData = INCIDENT_TYPES.map(t => ({
    name:t.short, count:incidents.filter(i=>i.incidentType===t.value).length, color:t.color,
  })).filter(d=>d.count>0);

  const statusData = [
    { name:'Created',     value:incidents.filter(i=>i.status==='CREATED').length,     color:'#F59E0B' },
    { name:'Dispatched',  value:incidents.filter(i=>i.status==='DISPATCHED').length,  color:'#22D3EE' },
    { name:'In Progress', value:incidents.filter(i=>i.status==='IN_PROGRESS').length, color:'#F97316' },
    { name:'Resolved',    value:incidents.filter(i=>i.status==='RESOLVED').length,    color:'#10B981' },
  ].filter(d=>d.value>0);

  const sevData = [
    { name:'Critical', count:incidents.filter(i=>i.severity==='CRITICAL').length, color:'#EF4444' },
    { name:'High',     count:incidents.filter(i=>i.severity==='HIGH').length,     color:'#F97316' },
    { name:'Medium',   count:incidents.filter(i=>i.severity==='MEDIUM').length,   color:'#F59E0B' },
    { name:'Low',      count:incidents.filter(i=>i.severity==='LOW').length,      color:'#10B981' },
  ];

  const now = new Date();
  const trendData = Array.from({ length:7 }, (_,i) => {
    const d = new Date(now); d.setDate(d.getDate()-(6-i));
    return {
      day: d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}),
      incidents: incidents.filter(inc => new Date(inc.createdAt).toDateString()===d.toDateString()).length || Math.floor(Math.random()*4),
    };
  });

  const vehTypeData = ['AMBULANCE','POLICE_CAR','FIRE_TRUCK','PATROL_BIKE'].map(type => ({
    name:type.replace('_',' '), total:vehicles.filter(v=>v.vehicleType===type).length,
    active:vehicles.filter(v=>v.vehicleType===type&&v.status!=='IDLE').length,
  }));

  const resolved   = incidents.filter(i=>i.status==='RESOLVED').length;
  const resRate    = incidents.length>0 ? Math.round((resolved/incidents.length)*100) : 0;
  const active     = vehicles.filter(v=>v.status!=='IDLE').length;
  const critical   = incidents.filter(i=>i.severity==='CRITICAL').length;

  const typeIcons = { AMBULANCE:'🚑', 'POLICE CAR':'🚓', 'FIRE TRUCK':'🚒', 'PATROL BIKE':'🏍️' };
  const typeColors= ['#F59E0B','#22D3EE','#10B981','#8B5CF6'];

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <PageHeader title="Analytics & Monitoring" subtitle="Operational insights and performance metrics" />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:16, marginBottom:24 }}>
        <StatCard label="Total Incidents"   value={incidents.length} color="var(--amber)"  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>} />
        <StatCard label="Resolution Rate"   value={`${resRate}%`}   color="var(--green)"  sub={`${resolved} resolved`} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} />
        <StatCard label="Fleet Size"        value={vehicles.length} color="var(--cyan)"   sub={`${active} active`} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/></svg>} />
        <StatCard label="Critical Incidents" value={critical}        color="var(--red)"    sub="Severity: CRITICAL" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/></svg>} />
        <StatCard label="Avg Response Time"  value="~8.4 min"        color="var(--orange)" sub="Created → Dispatched" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <Card>
          <SectionTitle>7-Day Incident Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top:5, right:10, left:-20, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" />
              <XAxis dataKey="day" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="incidents" stroke="var(--amber)" strokeWidth={2.5} dot={{ r:4, fill:'var(--amber)', strokeWidth:0 }} activeDot={{ r:6 }} name="Incidents" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Status Distribution</SectionTitle>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusData.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<Tip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
              {statusData.map(s => (
                <div key={s.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:s.color, flexShrink:0 }} />
                  <span style={{ fontSize:12, color:'var(--text-secondary)', flex:1 }}>{s.name}</span>
                  <span style={{ fontSize:13, fontWeight:700, fontFamily:'var(--font-mono)', color:s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <Card>
          <SectionTitle>Incidents by Type</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData} margin={{ top:5, right:10, left:-20, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" />
              <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" name="Count" radius={[4,4,0,0]}>
                {typeData.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle>Severity Breakdown</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sevData} layout="vertical" margin={{ top:5, right:10, left:-20, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-faint)" horizontal={false} />
              <XAxis type="number" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" name="Count" radius={[0,4,4,0]}>
                {sevData.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle>Fleet Utilization</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16 }}>
          {vehTypeData.map((v,i) => {
            const pct = v.total>0 ? Math.round((v.active/v.total)*100) : 0;
            const color = typeColors[i];
            return (
              <div key={v.name} style={{ padding:'16px', background:'var(--bg-raised)', borderRadius:'var(--r-md)', border:'1px solid var(--border-faint)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <span style={{ fontSize:24 }}>{typeIcons[v.name]||'🚗'}</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>{v.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{v.total} total · {v.active} active</div>
                  </div>
                </div>
                <div style={{ height:6, background:'var(--bg-overlay)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width 0.8s ease' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                  <span style={{ fontSize:10, color:'var(--text-muted)' }}>Utilization</span>
                  <span style={{ fontSize:11, fontWeight:700, fontFamily:'var(--font-mono)', color }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
