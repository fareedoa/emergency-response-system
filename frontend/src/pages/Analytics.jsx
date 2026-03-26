import { useState, useEffect } from 'react';
import { analyticsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Card, SectionTitle, SkeletonCard, Spinner } from '../components/UI';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const C = {
  brand:   '#F59E0B',
  dispatch:'#22D3EE',
  danger:  '#EF4444',
  warning: '#F97316',
  success: '#22C55E',
  violet:  '#818CF8',
  muted:   '#3D5275',
};

const TYPE_COLORS = {
  MEDICAL_EMERGENCY: C.success,
  FIRE:              C.danger,
  CRIME:             C.dispatch,
  ROBBERY:           C.warning,
  ACCIDENT:          C.violet,
  OTHER:             C.muted,
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-normal)', borderRadius: 'var(--r-md)', padding: '12px 16px', boxShadow: 'var(--shadow-lg)' }}>
      {label && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 3, color: 'var(--text-secondary)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || p.fill, flexShrink: 0 }} />
          <span>{p.name || p.dataKey}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function KPICard({ label, value, sub, color }) {
  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color || C.brand}, transparent)` }} />
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: color || C.brand, lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}

const chartProps = {
  cartesian: {
    CartesianGrid: { strokeDasharray: '3 3', stroke: 'var(--border-faint)', vertical: false },
    XAxis: { tick: { fill: 'var(--text-muted)', fontSize: 10 }, axisLine: false, tickLine: false },
    YAxis: { tick: { fill: 'var(--text-muted)', fontSize: 10 }, axisLine: false, tickLine: false, width: 32 },
  },
};

export default function Analytics() {
  const { is } = useAuth();
  const [summary, setSummary]   = useState(null);
  const [trends, setTrends]     = useState([]);
  const [respTimes, setRespTimes] = useState([]);
  const [resUtil, setResUtil]   = useState([]);
  const [hospCap, setHospCap]   = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [topResp, setTopResp]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsApi.summary(),
      analyticsApi.incidentTrends(),
      analyticsApi.responseTimes(),
      analyticsApi.resourceUtil(),
      ...(is('HOSPITAL_ADMIN', 'SYSTEM_ADMIN') ? [analyticsApi.hospitalCapacity()] : [Promise.resolve({ data: [] })]),
      analyticsApi.peakHours(),
      ...(is('SYSTEM_ADMIN') ? [analyticsApi.topResponders()] : [Promise.resolve({ data: [] })]),
    ]).then(([sumR, trendR, rtR, ruR, hcR, phR, trR]) => {
      if (sumR.data)    setSummary(sumR.data);
      if (trendR.data)  setTrends(normalizeTrends(trendR.data));
      if (rtR.data)     setRespTimes(normalizeRT(rtR.data));
      if (ruR.data)     setResUtil(ruR.data || []);
      if (hcR.data)     setHospCap(hcR.data || []);
      if (phR.data)     setPeakHours(normalizePeak(phR.data));
      if (trR.data)     setTopResp(trR.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <PageHeader title="Analytics" subtitle="Operational intelligence aggregated from all services" />

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard label="Incidents Today"  value={summary?.totalIncidentsToday}                  color={C.brand} />
        <KPICard label="Open Incidents"   value={summary?.openIncidents}                         color={C.danger} />
        <KPICard label="Avg Response"     value={summary?.averageResponseTimeSeconds ? `${Math.round(summary.averageResponseTimeSeconds / 60)}m` : null} color={C.success} sub="Resolved incidents" />
        <KPICard label="Active Units"     value={summary?.activeUnits}                           color={C.dispatch} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Incident Trends */}
        <Card>
          <SectionTitle>Incident Trends (7-day rolling)</SectionTitle>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trends} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  {Object.entries(TYPE_COLORS).map(([k, color]) => (
                    <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid {...chartProps.cartesian.CartesianGrid} />
                <XAxis dataKey="label" {...chartProps.cartesian.XAxis} />
                <YAxis {...chartProps.cartesian.YAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: 'var(--text-muted)' }} />
                {Object.entries(TYPE_COLORS).map(([key, color]) => (
                  <Area key={key} type="monotone" dataKey={key} name={key.replace('_', ' ')} stroke={color} fill={`url(#grad-${key})`} strokeWidth={2} dot={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </Card>

        {/* Fleet Utilisation */}
        <Card>
          <SectionTitle>Fleet Utilization</SectionTitle>
          {resUtil.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {resUtil.slice(0, 5).map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.stationName || s.stationType || `Station ${i+1}`}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.brand, fontFamily: 'var(--font-mono)' }}>{Math.round(s.utilizationPercentage || 0)}%</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--bg-raised)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(s.utilizationPercentage || 0, 100)}%`, background: `linear-gradient(90deg, ${C.brand}, ${C.dispatch})`, borderRadius: 3, transition: 'width 0.7s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <NoData />}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Response Times */}
        <Card>
          <SectionTitle>Avg Response Times (seconds)</SectionTitle>
          {respTimes.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={respTimes} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid {...chartProps.cartesian.CartesianGrid} />
                <XAxis dataKey="label" {...chartProps.cartesian.XAxis} />
                <YAxis {...chartProps.cartesian.YAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgSeconds" name="Avg (s)" radius={[4, 4, 0, 0]} fill={C.brand} />
                <Bar dataKey="minSeconds" name="Min (s)" radius={[4, 4, 0, 0]} fill={C.success} />
                <Bar dataKey="maxSeconds" name="Max (s)" radius={[4, 4, 0, 0]} fill={C.danger} />
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </Card>

        {/* Peak Hours */}
        <Card>
          <SectionTitle>Peak Incident Hours</SectionTitle>
          {peakHours.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={peakHours} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid {...chartProps.cartesian.CartesianGrid} />
                <XAxis dataKey="hour" {...chartProps.cartesian.XAxis} tickFormatter={h => `${h}h`} />
                <YAxis {...chartProps.cartesian.YAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Incidents" radius={[4, 4, 0, 0]}>
                  {peakHours.map((_, i) => (
                    <Cell key={i} fill={i < 3 ? C.danger : i < 6 ? C.warning : C.brand} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <NoData />}
        </Card>
      </div>

      {/* Hospital Capacity (HOSPITAL_ADMIN / SYSTEM_ADMIN) */}
      {is('HOSPITAL_ADMIN', 'SYSTEM_ADMIN') && hospCap.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <SectionTitle>Hospital Capacity</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {hospCap.map((h, i) => (
              <div key={i} style={{ padding: '14px 16px', background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-faint)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{h.stationName || `Hospital ${i+1}`}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Total</span><span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{h.totalUnits ?? '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Deployed</span><span style={{ color: C.warning, fontWeight: 600 }}>{h.deployedUnits ?? '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Idle</span><span style={{ color: C.success, fontWeight: 600 }}>{h.idleUnits ?? '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Responders (SYSTEM_ADMIN) */}
      {is('SYSTEM_ADMIN') && topResp.length > 0 && (
        <Card>
          <SectionTitle>Top Deployed Responders</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Rank', 'Station', 'Type', 'Dispatches'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topResp.slice(0, 10).map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-faint)' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: i < 3 ? C.brand : 'var(--text-muted)' }}>#{i + 1}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 500 }}>{r.stationName || r.stationType}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 12 }}>{r.vehicleType?.replace('_', ' ')}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: C.brand }}>{r.dispatchCount}</td>
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

function NoData() {
  return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>No data available yet</div>;
}

// ── Data normalisers ─────────────────────────────────────────────────────────
// Backend: { incidentType, count7d, count30d, count90d }
function normalizeTrends(data) {
  if (!Array.isArray(data) || !data.length) return [];
  const points = [{ label: '7d' }, { label: '30d' }, { label: '90d' }];
  data.forEach(r => {
    if (r.incidentType) {
      const key = r.incidentType;
      points[0][key] = (points[0][key] || 0) + (r.count7d || 0);
      points[1][key] = (points[1][key] || 0) + (r.count30d || 0);
      points[2][key] = (points[2][key] || 0) + (r.count90d || 0);
    }
  });
  return points;
}

// Backend: { incidentType, region, avgSeconds, minSeconds, maxSeconds }
function normalizeRT(data) {
  if (!Array.isArray(data) || !data.length) return [];
  return data.slice(0, 8).map(r => ({
    label: r.incidentType?.replace('_', ' ') || r.region || 'Unknown',
    avgSeconds: Math.round(r.avgSeconds || 0),
    minSeconds: Math.round(r.minSeconds || 0),
    maxSeconds: Math.round(r.maxSeconds || 0),
  }));
}

// Backend: { hour, dayOfWeek, count }
function normalizePeak(data) {
  if (!Array.isArray(data) || !data.length) return [];
  const hourMap = {};
  data.forEach(r => { hourMap[r.hour] = (hourMap[r.hour] || 0) + (r.count || 0); });
  return Object.entries(hourMap).sort(([a], [b]) => +a - +b).map(([h, count]) => ({ hour: +h, count }));
}
