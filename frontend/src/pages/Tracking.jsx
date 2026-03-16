import { useState, useEffect } from 'react';
import { trackingApi } from '../api';
import { PageHeader, Card, VehicleStatusBadge, SectionTitle, Btn } from '../components/UI';
import { fmtDateTime } from '../utils/constants';

const MOCK = [
  { id:'v1', registration:'GR-1234-22', vehicleType:'AMBULANCE',   status:'EN_ROUTE',   currentLat:5.6037, currentLng:-0.1870, stationType:'HOSPITAL',       activeIncidentId:'inc-001', updatedAt: new Date(Date.now()-3*60000).toISOString() },
  { id:'v2', registration:'GR-5678-22', vehicleType:'POLICE_CAR',  status:'ON_SCENE',   currentLat:5.5502, currentLng:-0.2174, stationType:'POLICE_STATION', activeIncidentId:'inc-002', updatedAt: new Date(Date.now()-7*60000).toISOString() },
  { id:'v3', registration:'GR-9012-22', vehicleType:'FIRE_TRUCK',  status:'IDLE',       currentLat:5.5480, currentLng:-0.2190, stationType:'FIRE_STATION',   activeIncidentId:null,      updatedAt: new Date(Date.now()-15*60000).toISOString() },
  { id:'v4', registration:'GR-3456-22', vehicleType:'AMBULANCE',   status:'IDLE',       currentLat:6.6885, currentLng:1.6244,  stationType:'HOSPITAL',       activeIncidentId:null,      updatedAt: new Date(Date.now()-20*60000).toISOString() },
  { id:'v5', registration:'GR-7890-22', vehicleType:'PATROL_BIKE', status:'RETURNING',  currentLat:4.8989, currentLng:-1.7577, stationType:'POLICE_STATION', activeIncidentId:null,      updatedAt: new Date(Date.now()-5*60000).toISOString() },
  { id:'v6', registration:'GR-2345-22', vehicleType:'POLICE_CAR',  status:'IDLE',       currentLat:5.6698, currentLng:-0.0166, stationType:'POLICE_STATION', activeIncidentId:null,      updatedAt: new Date(Date.now()-30*60000).toISOString() },
  { id:'v7', registration:'AS-1111-23', vehicleType:'FIRE_TRUCK',  status:'DISPATCHED', currentLat:6.6870, currentLng:1.6230,  stationType:'FIRE_STATION',   activeIncidentId:'inc-004', updatedAt: new Date(Date.now()-2*60000).toISOString() },
];

const ICONS  = { AMBULANCE:'🚑', POLICE_CAR:'🚓', FIRE_TRUCK:'🚒', PATROL_BIKE:'🏍️' };
const COLORS = { IDLE:'var(--green)', DISPATCHED:'var(--cyan)', EN_ROUTE:'var(--orange)', ON_SCENE:'var(--red)', RETURNING:'var(--amber)' };

export default function Tracking() {
  const [vehicles, setVehicles] = useState(MOCK);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    trackingApi.listVehicles().then(r=>{ if(r.data?.length) setVehicles(r.data); }).catch(()=>{});
    const id = setInterval(() => {
      trackingApi.listVehicles().then(r=>{ if(r.data?.length) setVehicles(r.data); }).catch(()=>{});
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const filtered = vehicles.filter(v => filter==='ALL' || v.status===filter);
  const selected = vehicles.find(v => v.id===selectedId);
  const statusGroups = ['IDLE','EN_ROUTE','ON_SCENE','RETURNING','DISPATCHED'];

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <PageHeader title="Live Tracking" subtitle="Real-time vehicle position monitoring — updates every 10 seconds" />

      <Card style={{ marginBottom:20, padding:'14px 24px' }}>
        <div style={{ display:'flex', gap:20, flexWrap:'wrap', alignItems:'center' }}>
          {statusGroups.map(s => {
            const count = vehicles.filter(v=>v.status===s).length;
            const color = COLORS[s]||'var(--text-secondary)';
            return (
              <button key={s} onClick={()=>setFilter(filter===s?'ALL':s)}
                style={{ display:'flex', alignItems:'center', gap:8, background:filter===s?`${color}15`:'transparent', border:'none', cursor:'pointer', padding:'6px 10px', borderRadius:'var(--r-sm)', outline:filter===s?`1px solid ${color}30`:'none' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:count>0?color:'var(--border-normal)', animation:(['EN_ROUTE','ON_SCENE'].includes(s)&&count>0)?'pulse 2s ease-in-out infinite':'none' }} />
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:count>0?color:'var(--text-muted)' }}>{count} {s.replace('_',' ')}</span>
              </button>
            );
          })}
          <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{vehicles.length} total vehicles</span>
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20, alignItems:'start' }}>
        {/* Vehicle list */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Card style={{ padding:0 }}>
            <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border-faint)' }}>
              <SectionTitle>Fleet Vehicles</SectionTitle>
              <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:-12 }}>{filtered.length} shown</p>
            </div>
            {filtered.map(v => {
              const color = COLORS[v.status]||'var(--text-secondary)';
              const isSel = v.id===selectedId;
              return (
                <div key={v.id} onClick={()=>setSelectedId(isSel?null:v.id)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 18px', cursor:'pointer', transition:'background var(--ease-fast)', background:isSel?'var(--bg-hover)':'transparent', borderBottom:'1px solid var(--border-faint)', borderLeft:isSel?`3px solid ${color}`:'3px solid transparent' }}
                  onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.background='var(--bg-raised)'; }}
                  onMouseLeave={e=>{ if(!isSel) e.currentTarget.style.background='transparent'; }}
                >
                  <span style={{ fontSize:24, flexShrink:0 }}>{ICONS[v.vehicleType]||'🚗'}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--font-mono)', color:'var(--text-primary)', marginBottom:2 }}>{v.registration}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{v.vehicleType?.replace('_',' ')}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', marginTop:2 }}>{v.currentLat?.toFixed(4)}, {v.currentLng?.toFixed(4)}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                    <div style={{ fontSize:9, fontWeight:700, padding:'3px 7px', borderRadius:10, color, background:`${color}15`, border:`1px solid ${color}30`, textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>{v.status}</div>
                    {v.activeIncidentId && <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>INC•{v.activeIncidentId.slice(0,6)}</div>}
                  </div>
                </div>
              );
            })}
          </Card>

          {selected && (
            <Card glowColor={COLORS[selected.status]}>
              <SectionTitle>Vehicle Details</SectionTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  ['Registration', selected.registration],
                  ['Type', selected.vehicleType?.replace('_',' ')],
                  ['Station', selected.stationType?.replace('_',' ')],
                  ['GPS Lat', selected.currentLat?.toFixed(6)],
                  ['GPS Lng', selected.currentLng?.toFixed(6)],
                  ['Last Update', fmtDateTime(selected.updatedAt)],
                  ['Active Incident', selected.activeIncidentId||'—'],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:12, fontSize:12, borderBottom:'1px solid var(--border-faint)', paddingBottom:8 }}>
                    <span style={{ color:'var(--text-muted)' }}>{k}</span>
                    <span style={{ color:'var(--text-primary)', fontWeight:500, fontFamily:'var(--font-mono)', textAlign:'right', wordBreak:'break-all' }}>{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Map placeholder */}
        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border-faint)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, fontFamily:'var(--font-display)' }}>Live Map</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{vehicles.filter(v=>v.currentLat).length} vehicles with GPS data</div>
            </div>
            <div style={{ display:'flex', gap:14, fontSize:11, fontFamily:'var(--font-mono)' }}>
              {[['🟠','En Route'],['🔴','On Scene'],['🟢','Idle'],['🔵','Dispatched']].map(([e,l])=>(
                <div key={l} style={{ display:'flex', alignItems:'center', gap:5, color:'var(--text-muted)' }}><span>{e}</span><span>{l}</span></div>
              ))}
            </div>
          </div>

          {/* Visual map placeholder with vehicle positions */}
          <div style={{ width:'100%', height:520, background:'var(--bg-raised)', position:'relative', overflow:'hidden' }}>
            {/* Grid lines to simulate map */}
            <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px)', backgroundSize:'40px 40px' }} />

            {/* Ghana label */}
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', opacity:0.15 }}>
              <div style={{ fontSize:80, fontFamily:'var(--font-display)', fontWeight:800, color:'var(--amber)', letterSpacing:'-0.02em' }}>GHANA</div>
            </div>

            {/* Vehicle pins — positioned proportionally within the Ghana bounds */}
            {vehicles.filter(v=>v.currentLat).map(v => {
              // Map Ghana bounds (lat 4.5–11.5, lng -3.5–1.5) to the 520px height / 100% width container
              const latNorm  = 1 - (v.currentLat - 4.5) / (11.5 - 4.5);
              const lngNorm  = (v.currentLng - (-3.5)) / (1.5 - (-3.5));
              const top  = `${latNorm  * 80 + 10}%`;
              const left = `${lngNorm  * 80 + 10}%`;
              const color = COLORS[v.status]||'#888';
              const isSel = v.id === selectedId;
              return (
                <div key={v.id} onClick={()=>setSelectedId(v.id===selectedId?null:v.id)}
                  style={{ position:'absolute', top, left, transform:'translate(-50%,-50%)', cursor:'pointer', zIndex:isSel?10:1 }}>
                  <div style={{ width:isSel?44:34, height:isSel?44:34, borderRadius:'50%', background:color, border:`3px solid ${isSel?'white':color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:isSel?20:16, boxShadow:`0 0 ${isSel?20:10}px ${color}60`, transition:'all 0.2s', animation:['EN_ROUTE','ON_SCENE'].includes(v.status)?'pulse 2s ease-in-out infinite':'none' }}>
                    {ICONS[v.vehicleType]||'🚗'}
                  </div>
                  {isSel && (
                    <div style={{ position:'absolute', top:'calc(100% + 8px)', left:'50%', transform:'translateX(-50%)', background:'var(--bg-surface)', border:`1px solid ${color}`, borderRadius:'var(--r-sm)', padding:'6px 10px', whiteSpace:'nowrap', fontSize:11, color:'var(--text-primary)', fontFamily:'var(--font-mono)', boxShadow:'var(--shadow-md)', zIndex:20 }}>
                      <div style={{ fontWeight:700, color }}>{v.registration}</div>
                      <div style={{ color:'var(--text-muted)', marginTop:2 }}>{v.currentLat?.toFixed(4)}, {v.currentLng?.toFixed(4)}</div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Legend */}
            <div style={{ position:'absolute', bottom:16, right:16, background:'rgba(7,11,24,0.9)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-sm)', padding:'10px 14px' }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'var(--font-mono)' }}>Vehicle Status</div>
              {Object.entries(COLORS).map(([s,c]) => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:c, flexShrink:0 }} />
                  <span style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'var(--font-mono)' }}>{s.replace('_',' ')}</span>
                </div>
              ))}
            </div>

            {/* Note */}
            <div style={{ position:'absolute', bottom:16, left:16, background:'rgba(7,11,24,0.85)', border:'1px solid var(--amber-border)', borderRadius:'var(--r-sm)', padding:'8px 12px', fontSize:11, color:'var(--text-muted)' }}>
              Add <span style={{ color:'var(--amber)', fontFamily:'var(--font-mono)' }}>VITE_GOOGLE_MAPS_KEY</span> to .env for interactive Google Maps
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
