import { useState, useEffect } from 'react';
import { analyticsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Card, SectionTitle, Spinner } from '../components/UI';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Colour palette ────────────────────────────────────────────────────────
const C = {
  brand:   '#F59E0B', dispatch:'#22D3EE', danger: '#EF4444',
  warning: '#F97316', success: '#22C55E', violet: '#818CF8', muted: '#3D5275',
};
const TYPE_COLORS = {
  MEDICAL_EMERGENCY: C.success, FIRE: C.danger, CRIME: C.dispatch,
  ROBBERY: C.warning, ACCIDENT: C.violet, OTHER: C.muted,
};

// ── Shared chart props ────────────────────────────────────────────────────
const gridProps = { strokeDasharray: '3 3', stroke: 'var(--border-faint)', vertical: false };
const axisProps = { tick: { fill: 'var(--text-muted)', fontSize: 10 }, axisLine: false, tickLine: false };

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-surface)', border:'1px solid var(--border-normal)', borderRadius:'var(--r-md)', padding:'12px 16px', boxShadow:'var(--shadow-lg)' }}>
      {label !== undefined && <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, marginBottom:3, color:'var(--text-secondary)' }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:p.color||p.fill, flexShrink:0 }} />
          <span>{p.name||p.dataKey}</span>
          <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--text-primary)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function KPI({ label, value, sub, color }) {
  return (
    <Card style={{ padding:'18px 20px' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${color||C.brand}, transparent)` }} />
      <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:800, color:color||C.brand, lineHeight:1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>{sub}</div>}
    </Card>
  );
}

function NoData() {
  return <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)', fontSize:13 }}>No data yet</div>;
}

// ── Data normalisers ──────────────────────────────────────────────────────

// Backend: List<IncidentTrendResult>  { period:"7d"|"30d"|"90d", incidentType, count }
function normalizeTrends(data) {
  if (!Array.isArray(data) || !data.length) return [];
  const map = { '7d':{label:'7d'}, '30d':{label:'30d'}, '90d':{label:'90d'} };
  data.forEach(r => {
    const b = map[r.period];
    if (b && r.incidentType) b[r.incidentType] = (b[r.incidentType]||0) + (r.count||0);
  });
  return ['7d','30d','90d'].map(p => map[p]);
}

// Backend: List<ResponseTimeStat>  { serviceType, avgSeconds, minSeconds, maxSeconds }
function normalizeRT(data) {
  if (!Array.isArray(data) || !data.length) return [];
  return data.slice(0,8).map(r => ({
    label:      r.serviceType?.replace(/_/g,' ') || 'Unknown',
    avgSeconds: Math.round(r.avgSeconds||0),
    minSeconds: Math.round(r.minSeconds||0),
    maxSeconds: Math.round(r.maxSeconds||0),
  }));
}

// Backend: List<PeakHourResult>  { hourOfDay, dayOfWeek, dayLabel, count }
function normalizePeak(data) {
  if (!Array.isArray(data) || !data.length) return [];
  const hm = {};
  data.forEach(r => { hm[r.hourOfDay] = (hm[r.hourOfDay]||0) + (r.count||0); });
  return Object.entries(hm).sort(([a],[b])=>+a-+b).map(([h,count])=>({ hour:+h, count }));
}

// Backend: List<ResourceUtilizationResult>
//   { stationId, stationType, totalVehicles, dispatchedVehicles, idleVehicles }
function normalizeResUtil(data) {
  if (!Array.isArray(data) || !data.length) return [];
  return data.map(r => ({
    label:              r.stationType?.replace(/_/g,' ') || r.stationId || 'Unknown',
    totalVehicles:      r.totalVehicles      || 0,
    dispatchedVehicles: r.dispatchedVehicles || 0,
    idleVehicles:       r.idleVehicles       || 0,
    utilizationPct:     r.totalVehicles > 0
                          ? Math.round((r.dispatchedVehicles/r.totalVehicles)*1000)/10 : 0,
  }));
}

// ── Page component ────────────────────────────────────────────────────────
export default function Analytics() {
  const { is } = useAuth();
  const [summary,   setSummary]   = useState(null);
  const [trends,    setTrends]    = useState([]);
  const [respTimes, setRespTimes] = useState([]);
  const [resUtil,   setResUtil]   = useState([]);
  const [hospCap,   setHospCap]   = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [topResp,   setTopResp]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsApi.summary(),
      analyticsApi.incidentTrends(),
      analyticsApi.responseTimes(),
      analyticsApi.resourceUtil(),
      is('HOSPITAL_ADMIN','SYSTEM_ADMIN') ? analyticsApi.hospitalCapacity() : Promise.resolve({data:[]}),
      analyticsApi.peakHours(),
      is('SYSTEM_ADMIN') ? analyticsApi.topResponders() : Promise.resolve({data:[]}),
    ]).then(([sumR,trendR,rtR,ruR,hcR,phR,trR]) => {
      if (sumR.data)   setSummary(sumR.data);
      if (trendR.data) setTrends(normalizeTrends(trendR.data));
      if (rtR.data)    setRespTimes(normalizeRT(rtR.data));
      if (ruR.data)    setResUtil(normalizeResUtil(ruR.data));
      if (hcR.data)    setHospCap(hcR.data||[]);
      if (phR.data)    setPeakHours(normalizePeak(phR.data));
      if (trR.data)    setTopResp(trR.data||[]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  // avgResponseTimeFormatted comes directly from the backend (formatted string).
  // Fallback: compute it from avgResponseTimeSeconds.
  const avgFmt = summary?.avgResponseTimeFormatted
    || (summary?.avgResponseTimeSeconds
        ? `${Math.floor(summary.avgResponseTimeSeconds/60)}m ${Math.round(summary.avgResponseTimeSeconds%60)}s`
        : null);

  return (
    <div style={{ animation:'fadeUp 0.3s ease' }}>
      <PageHeader title="Analytics" subtitle="Operational intelligence aggregated from all services" />

      {/* ── KPI row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:16, marginBottom:24 }}>
        <KPI label="Incidents Today"   value={summary?.totalIncidentsToday}  color={C.brand} />
        <KPI label="Open Incidents"    value={summary?.openIncidents}         color={C.danger} />
        <KPI label="Avg Response"      value={avgFmt}                         color={C.success} sub="Resolved incidents" />
        <KPI label="Active Units"      value={summary?.activeUnits}           color={C.dispatch} />
        <KPI label="Active Responders" value={summary?.activeResponders}      color={C.warning} />
        <KPI label="Idle Responders"   value={summary?.idleResponders}        color={C.muted} />
      </div>

      {/* ── Trends + Fleet utilisation ── */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:20 }}>
        <Card>
          <SectionTitle>Incident Trends (7 / 30 / 90 days)</SectionTitle>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trends} margin={{ top:4, right:12, left:0, bottom:0 }}>
                <defs>
                  {Object.entries(TYPE_COLORS).map(([k,color]) => (
                    <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} width={32} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize:10, color:'var(--text-muted)' }} />
                {Object.entries(TYPE_COLORS).map(([key,color]) => (
                  <Area key={key} type="monotone" dataKey={key}
                    name={key.replace(/_/g,' ')} stroke={color}
                    fill={`url(#g-${key})`} strokeWidth={2} dot={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </Card>

        <Card>
          <SectionTitle>Fleet Utilization</SectionTitle>
          {resUtil.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {resUtil.slice(0,6).map((s,i) => (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, gap:8 }}>
                    <span style={{ fontSize:11, color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.label}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:C.brand, fontFamily:'var(--font-mono)', flexShrink:0 }}>
                      {s.dispatchedVehicles}/{s.totalVehicles} · {s.utilizationPct}%
                    </span>
                  </div>
                  <div style={{ height:5, background:'var(--bg-raised)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min(s.utilizationPct,100)}%`, background:`linear-gradient(90deg,${C.brand},${C.dispatch})`, borderRadius:3, transition:'width 0.7s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <NoData />}
        </Card>
      </div>

      {/* ── Response times + Peak hours ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <Card>
          <SectionTitle>Response Times by Service Type (s)</SectionTitle>
          {respTimes.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={respTimes} margin={{ top:4, right:12, left:0, bottom:0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis {...axisProps} width={36} />
                <Tooltip content={<Tip />} />
                <Legend wrapperStyle={{ fontSize:10, color:'var(--text-muted)' }} />
                <Bar dataKey="avgSeconds" name="Avg (s)" radius={[4,4,0,0]} fill={C.brand} />
                <Bar dataKey="minSeconds" name="Min (s)" radius={[4,4,0,0]} fill={C.success} />
                <Bar dataKey="maxSeconds" name="Max (s)" radius={[4,4,0,0]} fill={C.danger} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </Card>

        <Card>
          <SectionTitle>Peak Incident Hours</SectionTitle>
          {peakHours.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={peakHours} margin={{ top:4, right:12, left:0, bottom:0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="hour" {...axisProps} tickFormatter={h => `${h}:00`} />
                <YAxis {...axisProps} width={32} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="count" name="Incidents" radius={[4,4,0,0]}>
                  {peakHours.map((_,i) => (
                    <Cell key={i} fill={i < 3 ? C.danger : i < 7 ? C.warning : C.brand} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </Card>
      </div>

      {/* ── Hospital capacity ── */}
      {/* Backend: { stationType, totalVehicles, deployedVehicles, idleVehicles } */}
      {is('HOSPITAL_ADMIN','SYSTEM_ADMIN') && hospCap.length > 0 && (
        <Card style={{ marginBottom:20 }}>
          <SectionTitle>Hospital Ambulance Capacity</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
            {hospCap.map((h,i) => (
              <div key={i} style={{ padding:'14px 16px', background:'var(--bg-raised)', borderRadius:'var(--r-md)', border:'1px solid var(--border-faint)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', marginBottom:10 }}>
                  {h.stationType?.replace(/_/g,' ') || `Hospital ${i+1}`}
                </div>
                {[
                  ['Total',    h.totalVehicles,    'var(--text-secondary)'],
                  ['Deployed', h.deployedVehicles,  C.warning],
                  ['Idle',     h.idleVehicles,      C.success],
                ].map(([lbl,val,col]) => (
                  <div key={lbl} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginBottom:5 }}>
                    <span>{lbl}</span>
                    <span style={{ color:col, fontWeight:700, fontFamily:'var(--font-mono)' }}>{val ?? '—'}</span>
                  </div>
                ))}
                <div style={{ marginTop:8, height:4, background:'var(--bg-void)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:C.warning, borderRadius:2, transition:'width 0.7s',
                    width:`${h.totalVehicles>0 ? Math.round(h.deployedVehicles/h.totalVehicles*100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Top responders (SYSTEM_ADMIN) ── */}
      {/* Backend: { responderName, responderType, deployCount } */}
      {is('SYSTEM_ADMIN') && topResp.length > 0 && (
        <Card>
          <SectionTitle>Top Deployed Responders</SectionTitle>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border-subtle)' }}>
                  {['Rank','Responder','Type','Deployments'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topResp.slice(0,10).map((r,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--border-faint)' }}>
                    <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)', fontWeight:700, color:i<3?C.brand:'var(--text-muted)' }}>#{i+1}</td>
                    <td style={{ padding:'10px 14px', color:'var(--text-primary)', fontWeight:500 }}>{r.responderName}</td>
                    <td style={{ padding:'10px 14px', color:'var(--text-secondary)', fontSize:12 }}>{r.responderType?.replace(/_/g,' ')}</td>
                    <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)', fontWeight:700, color:C.brand }}>{r.deployCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
