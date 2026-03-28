import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentApi, trackingApi, analyticsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Card, StatCard, PageHeader, Btn, StatusBadge, SeverityBadge, SectionTitle, AlertBanner, Spinner } from '../components/UI';
import { VehicleIcon } from '../components/UI';
import { getTypeInfo, INCIDENT_TYPES, timeAgo, VEHICLE_STATUS_COLORS, ROLE_STATION } from '../utils/constants';
import { AlertTriangle, Activity, Truck, CheckCircle, BarChart2, RefreshCw } from 'lucide-react';


function TypeBar({ info, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  const Icon = info.Icon;
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          {Icon && <Icon size={12} strokeWidth={2} />}{info.label}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: info.color, fontFamily: 'var(--font-mono)' }}>{count}</span>
      </div>
      <div style={{ height: 4, background: 'var(--bg-raised)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: info.color, borderRadius: 2, transition: 'width 0.7s ease', minWidth: count > 0 ? 6 : 0 }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, is } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [countdown, setCountdown] = useState(30);

  const stationFilter = ROLE_STATION[user?.role];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [incRes, vRes, kpiRes] = await Promise.allSettled([
        is('SYSTEM_ADMIN') ? incidentApi.list() : incidentApi.listOpen(),
        trackingApi.listVehicles(),
        analyticsApi.summary(),
      ]);

      if (incRes.status === 'fulfilled') setIncidents(incRes.value.data || []);
      if (vRes.status === 'fulfilled') {
        const all = vRes.value.data || [];
        setVehicles(stationFilter ? all.filter(v => v.stationType === stationFilter) : all);
      }
      if (kpiRes.status === 'fulfilled' && kpiRes.value.data) setKpi(kpiRes.value.data);
    } finally {
      setLoading(false);
      setLastRefresh(Date.now());
      setCountdown(30);
    }
  }, [user?.role]);

  useEffect(() => { loadData(); }, [loadData]);

  // countdown timer
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { loadData(); return 30; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [loadData]);

  const openIncidents = incidents.filter(i => i.status !== 'RESOLVED');
  const criticalIncidents = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED');
  const activeVehicles = vehicles.filter(v => v.status !== 'IDLE');

  // Type breakdown
  const typeBreakdown = INCIDENT_TYPES.map(t => ({
    info: t,
    count: incidents.filter(i => i.incidentType === t.value).length,
  }));
  const totalByType = incidents.length;

  // KPI values: prefer analytics summary, fall back to computed
  const totalToday  = kpi?.totalIncidentsToday ?? incidents.length;
  const openCount   = kpi?.openIncidents ?? openIncidents.length;
  const activeUnits = kpi?.activeUnits ?? activeVehicles.length;

  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length;
  const avgResp = kpi?.averageResponseTimeSeconds
    ? `${Math.round(kpi.averageResponseTimeSeconds / 60)}m`
    : resolvedCount;

  if (loading && incidents.length === 0) return <Spinner />;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Command Center</h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Live · refreshes in <span style={{ color: 'var(--color-brand)' }}>{countdown}s</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {criticalIncidents.length > 0 && (
            <AlertBanner color="var(--color-danger)" icon={<AlertTriangle size={14} />}>
              {criticalIncidents.length} CRITICAL incident{criticalIncidents.length > 1 ? 's' : ''} active
            </AlertBanner>
          )}
          <Btn variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={loadData} loading={loading}>
            Refresh
          </Btn>
          {is('SYSTEM_ADMIN','HOSPITAL_ADMIN','POLICE_ADMIN','FIRE_ADMIN') && (
            <Btn size="sm" icon={<AlertTriangle size={13} />} onClick={() => navigate('/incidents/new')}>
              Log Incident
            </Btn>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Incidents Today"   value={totalToday}  color="var(--color-brand)"    icon={<Activity size={18} />} />
        <StatCard label="Open"              value={openCount}   color="var(--color-danger)"   icon={<AlertTriangle size={18} />} />
        <StatCard label="Active Units"      value={activeUnits} color="var(--color-dispatch)" icon={<Truck size={18} />} />
        <StatCard label={kpi?.averageResponseTimeSeconds ? 'Avg Response' : 'Resolved'} value={avgResp} color="var(--color-success)" icon={<CheckCircle size={18} />} sub={kpi?.averageResponseTimeSeconds ? 'avg to dispatch' : 'total resolved'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Recent Incidents */}
        <Card>
          <SectionTitle>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Recent Incidents
              {openIncidents.length > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: 'var(--color-danger)', background: 'var(--danger-soft)', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-danger)', animation: 'pulse 2s ease-in-out infinite' }} />
                LIVE
              </span>}
            </span>
          </SectionTitle>
          <div>
            {incidents.slice(0, 10).map(inc => {
              const typeInfo = getTypeInfo(inc.incidentType);
              const TypeIcon = typeInfo.Icon;
              const sevColor = { CRITICAL: 'var(--color-danger)', HIGH: 'var(--color-warning)', MEDIUM: 'var(--color-brand)', LOW: 'var(--color-success)' }[inc.severity] || 'var(--text-muted)';
              return (
                <div key={inc.id} onClick={() => navigate(`/incidents/${inc.id}`)} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--border-faint)', cursor: 'pointer', borderLeft: `3px solid ${sevColor}`, paddingLeft: 12, marginLeft: -12, transition: 'background var(--ease-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--r-sm)', background: `color-mix(in srgb, ${typeInfo.color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {TypeIcon && <TypeIcon size={16} color={typeInfo.color} strokeWidth={2} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inc.citizenName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{typeInfo.label} · {timeAgo(inc.createdAt)}</div>
                  </div>
                  <StatusBadge status={inc.status} />
                </div>
              );
            })}
            {incidents.length === 0 && !loading && <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>No incidents found</div>}
          </div>
          {incidents.length > 10 && (
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <Btn variant="secondary" size="sm" onClick={() => navigate('/incidents')}>View all {incidents.length} →</Btn>
            </div>
          )}
        </Card>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Type breakdown */}
          <Card>
            <SectionTitle>Incident Types</SectionTitle>
            {typeBreakdown.map(({ info, count }) => (
              <TypeBar key={info.value} info={info} count={count} total={totalByType} />
            ))}
          </Card>

          {/* Fleet status */}
          <Card>
            <SectionTitle>Fleet Status</SectionTitle>
            <div>
              {vehicles.slice(0, 8).map(v => {
                const color = VEHICLE_STATUS_COLORS[v.status] || 'var(--text-muted)';
                return (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-faint)' }}>
                    <span style={{ flexShrink: 0, color }}><VehicleIcon type={v.vehicleType} size={18} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{v.registration}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{v.vehicleType?.replace('_', ' ')}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{v.status?.replace('_', ' ')}</span>
                  </div>
                );
              })}
              {vehicles.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>No vehicles found</div>}
            </div>
            {vehicles.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Btn variant="secondary" size="sm" icon={<BarChart2 size={12} />} onClick={() => navigate('/vehicles')} style={{ width: '100%', justifyContent: 'center' }}>View Fleet</Btn>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
