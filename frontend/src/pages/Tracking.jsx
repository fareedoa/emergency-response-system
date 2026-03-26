import { useState, useCallback, useRef } from 'react';
import { trackingApi } from '../api';
import { PageHeader, Card, SectionTitle } from '../components/UI';
import { fmtDateTime } from '../utils/constants';
import { useVehicleSimulation } from '../utils/useVehicleSimulation';
import VehicleMap from '../components/VehicleMap';

// ── Initial mock positions (Ghana) ─────────────────────────────────────────
const MOCK = [
  { id:'v1', registration:'GR-1234-22', vehicleType:'AMBULANCE',   status:'EN_ROUTE',   currentLat:5.6037,  currentLng:-0.1870,  stationType:'HOSPITAL',       activeIncidentId:'inc-001', updatedAt: new Date(Date.now()-3*60000).toISOString() },
  { id:'v2', registration:'GR-5678-22', vehicleType:'POLICE_CAR',  status:'ON_SCENE',   currentLat:5.5502,  currentLng:-0.2174,  stationType:'POLICE_STATION', activeIncidentId:'inc-002', updatedAt: new Date(Date.now()-7*60000).toISOString() },
  { id:'v3', registration:'GR-9012-22', vehicleType:'FIRE_TRUCK',  status:'IDLE',       currentLat:5.5480,  currentLng:-0.2190,  stationType:'FIRE_STATION',   activeIncidentId:null,      updatedAt: new Date(Date.now()-15*60000).toISOString() },
  { id:'v4', registration:'GR-3456-22', vehicleType:'AMBULANCE',   status:'IDLE',       currentLat:6.6885,  currentLng:1.6244,   stationType:'HOSPITAL',       activeIncidentId:null,      updatedAt: new Date(Date.now()-20*60000).toISOString() },
  { id:'v5', registration:'GR-7890-22', vehicleType:'PATROL_BIKE', status:'RETURNING',  currentLat:4.8989,  currentLng:-1.7577,  stationType:'POLICE_STATION', activeIncidentId:null,      updatedAt: new Date(Date.now()-5*60000).toISOString() },
  { id:'v6', registration:'GR-2345-22', vehicleType:'POLICE_CAR',  status:'IDLE',       currentLat:5.6698,  currentLng:-0.0166,  stationType:'POLICE_STATION', activeIncidentId:null,      updatedAt: new Date(Date.now()-30*60000).toISOString() },
  { id:'v7', registration:'AS-1111-23', vehicleType:'FIRE_TRUCK',  status:'DISPATCHED', currentLat:6.6870,  currentLng:1.6230,   stationType:'FIRE_STATION',   activeIncidentId:'inc-004', updatedAt: new Date(Date.now()-2*60000).toISOString() },
];

// ── Visual constants ────────────────────────────────────────────────────────
const ICONS  = { AMBULANCE:'🚑', POLICE_CAR:'🚓', FIRE_TRUCK:'🚒', PATROL_BIKE:'🏍️' };
const COLORS = { IDLE:'#10B981', DISPATCHED:'#22D3EE', EN_ROUTE:'#F97316', ON_SCENE:'#EF4444', RETURNING:'#F59E0B' };
const STATUS_GROUPS = ['IDLE','EN_ROUTE','ON_SCENE','RETURNING','DISPATCHED'];

// ── Helper: seconds ago label ───────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return '—';
  const s = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 5)  return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s/60)}m ago`;
}

// ── StatusPill for filter bar ───────────────────────────────────────────────
function StatusPill({ label, color, count, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:8,
      background: active ? `${color}18` : 'transparent',
      border: 'none', cursor:'pointer', padding:'7px 12px',
      borderRadius:'var(--r-sm)',
      outline: active ? `1px solid ${color}35` : 'none',
      transition:'all var(--ease-fast)',
    }}>
      <span style={{
        width:8, height:8, borderRadius:'50%',
        background: count > 0 ? color : 'var(--border-normal)',
        animation: (['EN_ROUTE','ON_SCENE'].includes(label) && count > 0) ? 'pulse 2s ease-in-out infinite' : 'none',
        flexShrink:0,
      }} />
      <span style={{
        fontFamily:'var(--font-mono)', fontSize:11,
        color: count > 0 ? color : 'var(--text-muted)',
        whiteSpace:'nowrap',
      }}>{count} {label.replace('_',' ')}</span>
    </button>
  );
}

// ── Vehicle list row ────────────────────────────────────────────────────────
function VehicleRow({ v, isSelected, onClick, onLocate }) {
  const color = COLORS[v.status] || 'var(--text-secondary)';
  return (
    <div
      onClick={onClick}
      style={{
        display:'flex', alignItems:'center', gap:11, padding:'11px 16px',
        cursor:'pointer', transition:'background var(--ease-fast)',
        background: isSelected ? 'var(--bg-hover)' : 'transparent',
        borderBottom:'1px solid var(--border-faint)',
        borderLeft: isSelected ? `3px solid ${color}` : '3px solid transparent',
      }}
      onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background='var(--bg-raised)'; }}
      onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background='transparent'; }}
    >
      <span style={{ fontSize:22, flexShrink:0 }}>{ICONS[v.vehicleType]||'🚗'}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--font-mono)', color:'var(--text-primary)', marginBottom:1 }}>
          {v.registration}
        </div>
        <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
          {v.vehicleType?.replace('_',' ')}
        </div>
        <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)', marginTop:1 }}>
          {v.currentLat?.toFixed(4)}, {v.currentLng?.toFixed(4)}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
        <div style={{
          fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:10,
          color, background:`${color}15`, border:`1px solid ${color}28`,
          textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap',
        }}>{v.status.replace('_',' ')}</div>
        {v.activeIncidentId && (
          <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
            INC·{v.activeIncidentId.slice(0,6)}
          </div>
        )}
      </div>
      {/* Locate button */}
      <button
        onClick={e => { e.stopPropagation(); onLocate(v); }}
        title="Locate on map"
        style={{
          marginLeft:4, width:28, height:28, borderRadius:'var(--r-sm)',
          display:'flex', alignItems:'center', justifyContent:'center',
          background:'transparent', border:'1px solid var(--border-faint)',
          color:'var(--text-muted)', cursor:'pointer',
          transition:'all var(--ease-fast)', flexShrink:0,
        }}
        onMouseEnter={e => { e.currentTarget.style.background='var(--bg-raised)'; e.currentTarget.style.color=color; e.currentTarget.style.borderColor=`${color}40`; }}
        onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.borderColor='var(--border-faint)'; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
        </svg>
      </button>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function Tracking() {
  const { vehicles, isLive, lastRefreshed } = useVehicleSimulation(MOCK, trackingApi.listVehicles);
  const [selectedId,  setSelectedId]  = useState(null);
  const [filter,      setFilter]      = useState('ALL');
  const [flyTarget,   setFlyTarget]   = useState(null);
  const [resetCount,  setResetCount]  = useState(0);

  const selected  = vehicles.find(v => v.id === selectedId);
  const filtered  = vehicles.filter(v => filter === 'ALL' || v.status === filter);

  const handleSelect = useCallback((id) => setSelectedId(id), []);

  const handleLocate = useCallback((v) => {
    setSelectedId(v.id);
    setFlyTarget({ lat: v.currentLat, lng: v.currentLng, _ts: Date.now() });
  }, []);

  const handleReset = useCallback(() => {
    setSelectedId(null);
    setResetCount(c => c + 1);
  }, []);

  const color = selected ? COLORS[selected.status] : 'var(--amber)';

  return (
    <div style={{ animation:'fadeUp 0.3s ease', display:'flex', flexDirection:'column', gap:20 }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.01em' }}>
            Live Tracking
          </h1>
          <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:5 }}>
            Real-time vehicle position monitoring via OpenStreetMap
          </p>
        </div>
        {/* Live status pill */}
        <div style={{
          display:'flex', alignItems:'center', gap:8, padding:'8px 16px',
          background: isLive ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${isLive ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
          borderRadius:'var(--r-sm)',
        }}>
          <span style={{
            width:7, height:7, borderRadius:'50%',
            background: isLive ? '#10B981' : '#F59E0B',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize:11, fontWeight:700, fontFamily:'var(--font-mono)', color: isLive ? '#10B981' : '#F59E0B', textTransform:'uppercase', letterSpacing:'0.1em' }}>
            {isLive ? 'Live' : 'Simulated'}
          </span>
          {lastRefreshed && (
            <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
              · refreshed {timeAgo(lastRefreshed)}
            </span>
          )}
        </div>
      </div>

      {/* ── Status filter bar ── */}
      <Card style={{ padding:'12px 20px' }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          {STATUS_GROUPS.map(s => (
            <StatusPill key={s} label={s} color={COLORS[s]||'#888'}
              count={vehicles.filter(v => v.status===s).length}
              active={filter===s}
              onClick={() => setFilter(filter===s?'ALL':s)}
            />
          ))}
          <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
            {vehicles.length} vehicles total
          </span>
        </div>
      </Card>

      {/* ── Main grid: list + map ── */}
      <div style={{ display:'grid', gridTemplateColumns:'310px 1fr', gap:20, alignItems:'start' }}>

        {/* ── Left panel: vehicle list ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Fleet list */}
          <Card style={{ padding:0 }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border-faint)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <SectionTitle>Fleet Vehicles</SectionTitle>
                <p style={{ fontSize:10, color:'var(--text-muted)', marginTop:-12 }}>{filtered.length} shown</p>
              </div>
            </div>
            <div style={{ maxHeight:420, overflowY:'auto' }}>
              {filtered.map(v => (
                <VehicleRow
                  key={v.id} v={v}
                  isSelected={v.id===selectedId}
                  onClick={() => setSelectedId(v.id===selectedId ? null : v.id)}
                  onLocate={handleLocate}
                />
              ))}
            </div>
          </Card>

          {/* Selected vehicle detail card */}
          {selected && (
            <Card glowColor={color} style={{ padding:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <SectionTitle>Vehicle Detail</SectionTitle>
                <button onClick={() => handleLocate(selected)}
                  style={{ fontSize:11, color:color, background:`${color}15`, border:`1px solid ${color}30`, borderRadius:'var(--r-sm)', padding:'4px 10px', cursor:'pointer', fontFamily:'var(--font-mono)', fontWeight:700 }}>
                  ⊕ Focus
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                {[
                  ['Registration', selected.registration],
                  ['Type',         selected.vehicleType?.replace('_',' ')],
                  ['Station',      selected.stationType?.replace('_',' ')],
                  ['Status',       selected.status.replace('_',' ')],
                  ['GPS Lat',      selected.currentLat?.toFixed(6)],
                  ['GPS Lng',      selected.currentLng?.toFixed(6)],
                  ['Last Update',  fmtDateTime(selected.updatedAt)],
                  ['Active Inc.',  selected.activeIncidentId||'—'],
                ].map(([k, val]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:12, fontSize:12, borderBottom:'1px solid var(--border-faint)', paddingBottom:7 }}>
                    <span style={{ color:'var(--text-muted)' }}>{k}</span>
                    <span style={{ color:'var(--text-primary)', fontWeight:500, fontFamily:'var(--font-mono)', textAlign:'right', wordBreak:'break-all' }}>{val}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ── Right panel: Leaflet OSM map ── */}
        <Card style={{ padding:0, overflow:'hidden' }}>
          {/* Map header */}
          <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--border-faint)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, fontFamily:'var(--font-display)', display:'flex', alignItems:'center', gap:8 }}>
                🗺 Live Map
                <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:10, background:'rgba(34,211,238,0.12)', color:'#22D3EE', border:'1px solid rgba(34,211,238,0.2)', letterSpacing:'0.06em', fontFamily:'var(--font-mono)' }}>
                  OpenStreetMap
                </span>
              </div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>
                {vehicles.filter(v=>v.currentLat).length} vehicles with GPS · updates every 3s
              </div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {/* Legend */}
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                {[['#10B981','Idle'],['#F97316','En Route'],['#EF4444','On Scene'],['#22D3EE','Dispatched'],['#F59E0B','Returning']].map(([c,l])=>(
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:c, display:'inline-block', flexShrink:0 }} />
                    {l}
                  </div>
                ))}
              </div>
              {/* Reset button */}
              <button onClick={handleReset}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', fontSize:11, fontFamily:'var(--font-mono)', fontWeight:600, borderRadius:'var(--r-sm)', background:'var(--bg-raised)', border:'1px solid var(--border-normal)', color:'var(--text-secondary)', cursor:'pointer', whiteSpace:'nowrap', transition:'all var(--ease-fast)' }}
                onMouseEnter={e => { e.currentTarget.style.background='var(--bg-hover)'; e.currentTarget.style.color='var(--amber)'; e.currentTarget.style.borderColor='var(--amber-border)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='var(--bg-raised)'; e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.borderColor='var(--border-normal)'; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Reset View
              </button>
            </div>
          </div>

          {/* The actual map */}
          <div style={{ height:560 }}>
            <VehicleMap
              vehicles={vehicles}
              selectedId={selectedId}
              onSelect={handleSelect}
              flyTarget={flyTarget}
              resetTrigger={resetCount}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
