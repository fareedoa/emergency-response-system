import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentApi, trackingApi } from '../api';
import { Card, StatCard, PageHeader, Btn, StatusBadge, SeverityBadge, TypeBadge, SectionTitle } from '../components/UI';
import { getTypeInfo, timeAgo, fmtDateTime } from '../utils/constants';

const MOCK_INCIDENTS = [
  { id:'inc-001', citizenName:'Kwame Mensah',  incidentType:'MEDICAL_EMERGENCY', severity:'CRITICAL', status:'DISPATCHED',  latitude:5.6037,  longitude:-0.1870, createdAt: new Date(Date.now()-8*60000).toISOString() },
  { id:'inc-002', citizenName:'Abena Osei',    incidentType:'FIRE',              severity:'HIGH',     status:'IN_PROGRESS', latitude:5.5502,  longitude:-0.2174, createdAt: new Date(Date.now()-22*60000).toISOString() },
  { id:'inc-003', citizenName:'Kofi Asante',   incidentType:'CRIME',             severity:'HIGH',     status:'CREATED',     latitude:5.5580,  longitude:-0.1802, createdAt: new Date(Date.now()-35*60000).toISOString() },
  { id:'inc-004', citizenName:'Ama Darkwa',    incidentType:'ACCIDENT',          severity:'CRITICAL', status:'DISPATCHED',  latitude:5.6698,  longitude:-0.0166, createdAt: new Date(Date.now()-47*60000).toISOString() },
  { id:'inc-005', citizenName:'Yaw Boateng',   incidentType:'ROBBERY',           severity:'MEDIUM',   status:'RESOLVED',    latitude:5.5480,  longitude:-0.2190, createdAt: new Date(Date.now()-2*3600000).toISOString() },
  { id:'inc-006', citizenName:'Efua Mensah',   incidentType:'MEDICAL_EMERGENCY', severity:'HIGH',     status:'RESOLVED',    latitude:6.6885,  longitude:1.6244,  createdAt: new Date(Date.now()-3*3600000).toISOString() },
  { id:'inc-007', citizenName:'Nana Adjei',    incidentType:'FIRE',              severity:'LOW',      status:'RESOLVED',    latitude:4.8989,  longitude:-1.7577, createdAt: new Date(Date.now()-5*3600000).toISOString() },
  { id:'inc-008', citizenName:'Akosua Darko',  incidentType:'CRIME',             severity:'MEDIUM',   status:'CREATED',     latitude:5.5480,  longitude:-0.2190, createdAt: new Date(Date.now()-10*60000).toISOString() },
];

const MOCK_VEHICLES = [
  { id:'v1', registration:'GR-1234-22', vehicleType:'AMBULANCE',   status:'EN_ROUTE',   currentLat:5.6037, currentLng:-0.1870 },
  { id:'v2', registration:'GR-5678-22', vehicleType:'POLICE_CAR',  status:'ON_SCENE',   currentLat:5.5502, currentLng:-0.2174 },
  { id:'v3', registration:'GR-9012-22', vehicleType:'FIRE_TRUCK',  status:'IDLE',       currentLat:5.5480, currentLng:-0.2190 },
  { id:'v4', registration:'GR-3456-22', vehicleType:'AMBULANCE',   status:'IDLE',       currentLat:6.6885, currentLng:1.6244  },
  { id:'v5', registration:'GR-7890-22', vehicleType:'PATROL_BIKE', status:'RETURNING',  currentLat:4.8989, currentLng:-1.7577 },
  { id:'v6', registration:'GR-2345-22', vehicleType:'POLICE_CAR',  status:'IDLE',       currentLat:5.6698, currentLng:-0.0166 },
  { id:'v7', registration:'AS-1111-23', vehicleType:'FIRE_TRUCK',  status:'DISPATCHED', currentLat:6.6870, currentLng:1.6230  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);
  const [vehicles, setVehicles] = useState(MOCK_VEHICLES);
  const [loading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [inc, veh] = await Promise.allSettled([incidentApi.list(), trackingApi.listVehicles()]);
        if (inc.status==='fulfilled' && inc.value.data?.length) setIncidents(inc.value.data);
        if (veh.status==='fulfilled' && veh.value.data?.length) setVehicles(veh.value.data);
      } catch {}
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const open       = incidents.filter(i => i.status !== 'RESOLVED');
  const critical   = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED');
  const dispatched = incidents.filter(i => ['DISPATCHED','IN_PROGRESS'].includes(i.status));
  const resolved   = incidents.filter(i => i.status === 'RESOLVED');
  const activeVeh  = vehicles.filter(v => v.status !== 'IDLE');
  const recent     = [...incidents].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,7);
  const typeCounts = incidents.reduce((a,i) => { a[i.incidentType]=(a[i.incidentType]||0)+1; return a; }, {});

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <PageHeader
        title="Command Center"
        subtitle="SwiftAid Overview"
        actions={<Btn onClick={() => navigate('/incidents/new')} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}>LOG INCIDENT</Btn>}
      />

      {critical.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', marginBottom:24, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'var(--r-md)' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--red)', animation:'pulse 1.5s ease-in-out infinite', flexShrink:0 }} />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span style={{ fontSize:13, color:'var(--red)', fontWeight:600 }}>{critical.length} CRITICAL INCIDENT{critical.length>1?'S':''} — Immediate response required</span>
          <Btn variant="danger" size="sm" onClick={() => navigate('/incidents')} style={{ marginLeft:'auto' }}>View Now</Btn>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:24 }}>
        <StatCard label="Open Incidents"  value={open.length}       sub="Requiring attention"      color="var(--amber)" loading={loading} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>} />
        <StatCard label="Critical Alerts" value={critical.length}   sub="Needs immediate action"   color="var(--red)"   loading={loading} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/></svg>} />
        <StatCard label="Units Deployed"  value={dispatched.length} sub="Dispatched / In progress"  color="var(--cyan)"  loading={loading} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>} />
        <StatCard label="Resolved"        value={resolved.length}   sub="Successfully closed"       color="var(--green)" loading={loading} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} />
      </div>

      <Card style={{ marginBottom:24, padding:'14px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:0, flexWrap:'wrap' }}>
          {[
            { label:'Total Fleet',     val:vehicles.length,                   color:'var(--text-secondary)' },
            { label:'Active',          val:activeVeh.length,                  color:'var(--orange)' },
            { label:'Available',       val:vehicles.length-activeVeh.length,  color:'var(--green)' },
            { label:'Total Incidents', val:incidents.length,                  color:'var(--amber)' },
          ].map((s,i) => (
            <div key={s.label} style={{ display:'flex', alignItems:'center' }}>
              {i>0 && <div style={{ width:1, height:36, background:'var(--border-faint)', margin:'0 24px' }} />}
              <div style={{ padding:'6px 20px 6px 0' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, color:s.color, lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:3 }}>{s.label}</div>
              </div>
            </div>
          ))}
          <div style={{ marginLeft:'auto' }}>
            <Btn variant="secondary" size="sm" onClick={() => navigate('/vehicles')}>Fleet Management →</Btn>
          </div>
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, alignItems:'start' }}>
        <Card>
          <SectionTitle action={<Btn variant="secondary" size="sm" onClick={() => navigate('/incidents')}>View All</Btn>}>Recent Incidents</SectionTitle>
          <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16, marginTop:-8 }}>Live feed · auto-refreshes every 30s</p>
          {recent.map((inc,i) => {
            const t = getTypeInfo(inc.incidentType);
            return (
              <div key={inc.id} onClick={() => navigate(`/incidents/${inc.id}`)}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 14px', borderRadius:'var(--r-md)', cursor:'pointer', transition:'background var(--ease-fast)', borderBottom:i<recent.length-1?'1px solid var(--border-faint)':'none' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--bg-raised)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <div style={{ width:38, height:38, borderRadius:'var(--r-sm)', background:`${t.color}15`, border:`1px solid ${t.color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{t.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:'var(--text-primary)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inc.citizenName}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{t.label} · {timeAgo(inc.createdAt)}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5, flexShrink:0 }}>
                  <StatusBadge status={inc.status} />
                  <SeverityBadge severity={inc.severity} />
                </div>
              </div>
            );
          })}
        </Card>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <Card>
            <SectionTitle>Incident Types</SectionTitle>
            {['MEDICAL_EMERGENCY','FIRE','CRIME','ROBBERY','ACCIDENT','OTHER'].map(type => {
              const info = getTypeInfo(type);
              const count = typeCounts[type] || 0;
              const pct = incidents.length ? Math.round((count/incidents.length)*100) : 0;
              return (
                <div key={type} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:12, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:6 }}><span>{info.icon}</span>{info.label}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:info.color, fontFamily:'var(--font-mono)' }}>{count}</span>
                  </div>
                  <div style={{ height:4, background:'var(--bg-raised)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:info.color, borderRadius:2, transition:'width 0.6s ease', minWidth:count>0?8:0 }} />
                  </div>
                </div>
              );
            })}
          </Card>

          <Card>
            <SectionTitle action={<Btn variant="secondary" size="sm" onClick={()=>navigate('/tracking')}>Track →</Btn>}>Fleet Status</SectionTitle>
            {vehicles.slice(0,5).map(v => {
              const color = v.status==='IDLE'?'var(--green)':v.status==='EN_ROUTE'?'var(--orange)':v.status==='ON_SCENE'?'var(--red)':'var(--cyan)';
              return (
                <div key={v.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border-faint)' }}>
                  <span style={{ fontSize:20 }}>{v.vehicleType==='AMBULANCE'?'🚑':v.vehicleType==='POLICE_CAR'?'🚓':v.vehicleType==='FIRE_TRUCK'?'🚒':'🏍️'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-mono)' }}>{v.registration}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase' }}>{v.vehicleType?.replace('_',' ')}</div>
                  </div>
                  <div style={{ fontSize:10, fontWeight:700, color, background:`${color}15`, padding:'3px 8px', borderRadius:10, textTransform:'uppercase', letterSpacing:'0.08em', border:`1px solid ${color}30` }}>{v.status}</div>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
}
