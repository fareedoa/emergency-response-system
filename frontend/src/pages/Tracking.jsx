import { useState, useEffect, useCallback, useRef } from 'react';
import { trackingApi, incidentApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTrackingSocket } from '../hooks/useTrackingSocket';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PageHeader, Card, VehicleStatusBadge, VehicleIcon } from '../components/UI';
import { VEHICLE_STATUS_COLORS, ROLE_STATION } from '../utils/constants';
import { Hospital, Shield, Flame, AlertTriangle, MapPin } from 'lucide-react';

// Fix Leaflet default marker icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TLABEL = { AMBULANCE: 'Ambulance', FIRE_TRUCK: 'Fire Truck', POLICE_CAR: 'Police Car', PATROL_BIKE: 'Patrol Bike' };
const STATUS_ORDER = ['EN_ROUTE', 'ON_SCENE', 'DISPATCHED', 'RETURNING', 'IDLE'];

// SVG strings for Leaflet divIcon HTML (white stroke)
const VEHICLE_SVG = {
  AMBULANCE:   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><path d="M5 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/><path d="M17 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/><path d="M8 8v4"/><path d="M6 10h4"/></svg>`,
  FIRE_TRUCK:  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  POLICE_CAR:  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  PATROL_BIKE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`,
};
const VEHICLE_SVG_DEFAULT = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;

const STATION_CFG = {
  HOSPITAL:       { color: '#22D3EE', label: 'Hospital',       Icon: Hospital },
  POLICE_STATION: { color: '#818CF8', label: 'Police Station', Icon: Shield   },
  FIRE_STATION:   { color: '#EF4444', label: 'Fire Station',   Icon: Flame    },
};

// SVG strings for station Leaflet icons (colored stroke)
const STATION_SVG = {
  HOSPITAL:       (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M12 7v6"/><path d="M9 10h6"/></svg>`,
  POLICE_STATION: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  FIRE_STATION:   (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
};
const STATION_SVG_DEFAULT = (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

const INCIDENT_TYPE_COLORS = {
  MEDICAL_EMERGENCY: '#22C55E',
  FIRE:              '#F59E0B',
  CRIME:             '#818CF8',
  ROBBERY:           '#EF4444',
  ACCIDENT:          '#3B82F6',
  OTHER:             '#888',
};

// SVG string for incident Leaflet icon
const INCIDENT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;

function makeVehicleIcon(color, selected, type, noGps) {
  const s   = selected ? 46 : 36;
  const svg = VEHICLE_SVG[type] || VEHICLE_SVG_DEFAULT;
  const opacity = noGps ? 0.45 : 1;
  return L.divIcon({
    className: '',
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
    html: `<div style="width:${s}px;height:${s}px;border-radius:50%;
      background:color-mix(in srgb,${color} 85%,#0e1527);
      border:${selected ? 3 : 2}px solid ${selected ? '#fff' : color};
      box-shadow:0 0 ${selected ? 24 : 10}px ${color}99;
      display:flex;align-items:center;justify-content:center;
      opacity:${opacity};transition:all .2s;">${svg}</div>`,
  });
}

function makeStationIcon(stationType) {
  const cfg  = STATION_CFG[stationType] || { color: '#888' };
  const svgFn = STATION_SVG[stationType] || STATION_SVG_DEFAULT;
  return L.divIcon({
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div style="width:34px;height:34px;border-radius:6px;
      background:color-mix(in srgb,${cfg.color} 20%,#0e1527);
      border:2px solid ${cfg.color};
      box-shadow:0 0 8px ${cfg.color}66;
      display:flex;align-items:center;justify-content:center;">${svgFn(cfg.color)}</div>`,
  });
}

function makeIncidentIcon(incidentType) {
  const color = INCIDENT_TYPE_COLORS[incidentType] || '#888';
  return L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="width:30px;height:30px;border-radius:50%;
      background:color-mix(in srgb,${color} 25%,#0e1527);
      border:2px solid ${color};opacity:0.85;
      box-shadow:0 0 8px ${color}77;
      display:flex;align-items:center;justify-content:center;">${INCIDENT_SVG}</div>`,
  });
}

function FlyTo({ pos }) {
  const map  = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (pos && (prev.current?.[0] !== pos[0] || prev.current?.[1] !== pos[1])) {
      map.flyTo(pos, 14, { duration: 1 });
      prev.current = pos;
    }
  }, [pos, map]);
  return null;
}

function ago(iso) {
  if (!iso) return '—';
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

export default function Tracking() {
  const { user }      = useAuth();
  const stationFilter = ROLE_STATION[user?.role];

  const [vehicles,     setVehicles]     = useState([]);
  const [stations,     setStations]     = useState([]);
  const [incidents,    setIncidents]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedId,   setSelectedId]   = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search,       setSearch]       = useState('');
  const [liveCount,    setLiveCount]    = useState(0);

  const loadAll = useCallback(async () => {
    try {
      const [vRes, sRes, iRes] = await Promise.all([
        trackingApi.listVehicles(),
        trackingApi.listStations(),
        incidentApi.listOpen(),
      ]);
      const all = vRes.data || [];
      setVehicles(stationFilter ? all.filter(v => v.stationType === stationFilter) : all);
      setStations(sRes.data || []);
      setIncidents(iRes.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [stationFilter]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    const id = setInterval(loadAll, 30000);
    return () => clearInterval(id);
  }, [loadAll]);

  const { connected } = useTrackingSocket((upd) => {
    setVehicles(prev => prev.map(v =>
      String(v.id) === upd.vehicleId
        ? { ...v, currentLat: upd.latitude, currentLng: upd.longitude,
            status: upd.status || v.status, updatedAt: upd.updatedAt }
        : v
    ));
    setLiveCount(n => n + 1);
  });

  const stationById  = Object.fromEntries(stations.map(s  => [String(s.id),  s]));
  const incidentById = Object.fromEntries(incidents.map(i => [String(i.id), i]));

  function vehiclePos(v) {
    if (v.currentLat != null) return [v.currentLat, v.currentLng];
    const st = stationById[String(v.stationId)];
    if (st?.latitude != null) return [st.latitude, st.longitude];
    return null;
  }

  const filtered = vehicles.filter(v => {
    if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
    if (search && !v.registration?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected     = vehicles.find(v => v.id === selectedId);
  const flyTarget    = selected ? vehiclePos(selected) : null;
  const withGps      = vehicles.filter(v => v.currentLat != null);
  const activeCount  = vehicles.filter(v => ['EN_ROUTE', 'ON_SCENE'].includes(v.status)).length;
  const statusCounts = STATUS_ORDER.reduce((a, s) => ({ ...a, [s]: vehicles.filter(v => v.status === s).length }), {});

  const pill = (active, color) => ({
    padding: '4px 12px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 700,
    fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', cursor: 'pointer', border: '1px solid',
    borderColor: active ? (color || 'var(--color-brand)') : 'transparent',
    background: active ? `color-mix(in srgb, ${color || 'var(--color-brand)'} 14%, transparent)` : 'transparent',
    color: active ? (color || 'var(--color-brand)') : 'var(--text-muted)',
  });

  return (
    <div style={{ animation: 'fadeUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <PageHeader
          title="Live Tracking"
          subtitle={`${withGps.length} of ${vehicles.length} with GPS · ${activeCount} active · ${incidents.length} open incident${incidents.length !== 1 ? 's' : ''}`}
        />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
          borderRadius: 'var(--r-full)', border: '1px solid var(--border-subtle)',
          background: 'var(--bg-raised)', fontSize: 11, fontFamily: 'var(--font-mono)', flexShrink: 0,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: connected ? 'var(--color-success)' : 'var(--color-danger)',
            animation: connected ? 'pulse 2s ease-in-out infinite' : 'none',
          }} />
          <span style={{ color: connected ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {connected ? `LIVE · ${liveCount} update${liveCount !== 1 ? 's' : ''}` : 'Reconnecting…'}
          </span>
        </div>
      </div>

      {/* Status filter bar */}
      <Card style={{ padding: '10px 18px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={pill(statusFilter === 'ALL', 'var(--color-brand)')} onClick={() => setStatusFilter('ALL')}>
            ALL · {vehicles.length}
          </button>
          {STATUS_ORDER.map(s => {
            const color = VEHICLE_STATUS_COLORS[s] || 'var(--text-muted)';
            return (
              <button key={s} style={pill(statusFilter === s, color)}
                onClick={() => setStatusFilter(statusFilter === s ? 'ALL' : s)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  {['EN_ROUTE', 'ON_SCENE'].includes(s) && statusCounts[s] > 0 && (
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, animation: 'pulse 1.6s ease-in-out infinite' }} />
                  )}
                  {s.replace('_', ' ')} · {statusCounts[s] || 0}
                </span>
              </button>
            );
          })}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search plate…"
            style={{
              marginLeft: 'auto', background: 'var(--bg-void)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--r-sm)', padding: '5px 10px', color: 'var(--text-primary)',
              fontSize: 11, fontFamily: 'var(--font-mono)', outline: 'none', width: 140,
            }}
          />
        </div>
      </Card>

      {/* Sidebar + Map */}
      <div className="mob-1col" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>

        {/* Vehicle list */}
        <Card className="tracking-list" style={{ padding: 0, maxHeight: 680, overflowY: 'auto' }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--border-faint)',
            fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)',
            position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 1,
          }}>
            Fleet · {filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}
          </div>

          {loading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Loading…</div>}
          {!loading && filtered.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No vehicles match.</div>}

          {filtered.map(v => {
            const color  = VEHICLE_STATUS_COLORS[v.status] || 'var(--text-secondary)';
            const isSel  = v.id === selectedId;
            const isLive = ['EN_ROUTE', 'ON_SCENE'].includes(v.status);
            const hasGps = v.currentLat != null;
            return (
              <div key={v.id} onClick={() => setSelectedId(isSel ? null : v.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border-faint)',
                  borderLeft: `3px solid ${isSel ? color : 'transparent'}`,
                  background: isSel ? 'var(--bg-hover)' : 'transparent',
                  transition: 'all var(--ease-fast)',
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--bg-raised)'; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ flexShrink: 0, opacity: hasGps ? 1 : 0.45, display: 'flex', alignItems: 'center' }}>
                  <VehicleIcon type={v.vehicleType} size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{v.registration}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{TLABEL[v.vehicleType] || v.vehicleType}</div>
                  {hasGps
                    ? <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{v.currentLat?.toFixed(4)}, {v.currentLng?.toFixed(4)}</div>
                    : <div style={{ fontSize: 9, color: '#F59E0B', fontFamily: 'var(--font-mono)', marginTop: 1 }}>at station</div>
                  }
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isLive && <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, animation: 'pulse 1.5s ease-in-out infinite' }} />}
                    <span style={{
                      fontSize: 9, fontWeight: 700, color, padding: '2px 7px', borderRadius: 'var(--r-full)',
                      background: `color-mix(in srgb, ${color} 13%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                    }}>{v.status}</span>
                  </div>
                  {v.updatedAt && <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{ago(v.updatedAt)}</div>}
                </div>
              </div>
            );
          })}

          {/* Selected vehicle detail panel */}
          {selected && (
            <div style={{ padding: 14, borderTop: '2px solid var(--border-subtle)', background: `color-mix(in srgb, ${VEHICLE_STATUS_COLORS[selected.status] || 'var(--color-brand)'} 6%, var(--bg-surface))` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Selected</div>
              {[
                ['Plate',    selected.registration],
                ['Type',     TLABEL[selected.vehicleType] || selected.vehicleType],
                ['Station',  selected.stationType?.replace(/_/g, ' ')],
                ['GPS',      selected.currentLat ? `${selected.currentLat?.toFixed(5)}, ${selected.currentLng?.toFixed(5)}` : 'At station'],
                ['Incident', selected.activeIncidentId ? selected.activeIncidentId.slice(0, 8) + '…' : 'None'],
                ['Updated',  ago(selected.updatedAt)],
              ].map(([k, val]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, paddingBottom: 6, marginBottom: 6, borderBottom: '1px solid var(--border-faint)' }}>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{k}</span>
                  <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 10, textAlign: 'right', wordBreak: 'break-all' }}>{val ?? '—'}</span>
                </div>
              ))}
              <div style={{ marginTop: 8 }}><VehicleStatusBadge status={selected.status} /></div>
            </div>
          )}

          {/* Station list */}
          {stations.length > 0 && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-faint)', background: 'var(--bg-raised)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                Stations · {stations.length}
              </div>
              {stations.map(s => {
                const cfg = STATION_CFG[s.stationType] || { color: '#888', label: s.stationType };
                const StIcon = cfg.Icon || MapPin;
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    <StIcon size={13} color={cfg.color} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    <span style={{ fontSize: 9, color: cfg.color, fontWeight: 700, flexShrink: 0 }}>{s.stationType?.replace(/_/g, ' ')}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Map */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              Live Map
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 10 }}>
                {withGps.length} GPS · {stations.length} stations · {incidents.length} open
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 10, fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
              {[
                { c: 'var(--color-warning)', l: 'En Route',    Icon: null,     round: true  },
                { c: 'var(--color-danger)',  l: 'On Scene',    Icon: null,     round: true  },
                { c: 'var(--color-success)', l: 'Idle',        Icon: null,     round: true  },
                { c: '#22D3EE',              l: 'Hospital',    Icon: Hospital, round: false },
                { c: '#818CF8',              l: 'Police Stn',  Icon: Shield,   round: false },
                { c: '#EF4444',              l: 'Fire Stn',    Icon: Flame,    round: false },
                { c: '#F59E0B',              l: '— Route',     Icon: null,     round: false },
              ].map(({ c, l, Icon: LIcon, round }) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                  {LIcon
                    ? <LIcon size={9} color={c} strokeWidth={2} />
                    : <span style={{ width: 8, height: 8, borderRadius: round ? '50%' : 2, background: c, flexShrink: 0 }} />
                  }
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="map-h-tracking" style={{ height: 580 }}>
            <MapContainer center={[7.95, -1.02]} zoom={7} style={{ width: '100%', height: '100%' }} zoomControl attributionControl>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd" maxZoom={19}
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              {flyTarget && <FlyTo pos={flyTarget} />}

              {/* Layer A — Station markers */}
              {stations.filter(s => s.latitude != null).map(s => {
                const cfg = STATION_CFG[s.stationType] || { color: '#888', label: s.stationType };
                const StIcon = cfg.Icon || MapPin;
                return (
                  <Marker key={`st-${s.id}`} position={[s.latitude, s.longitude]} icon={makeStationIcon(s.stationType)}>
                    <Popup>
                      <div style={{ minWidth: 140 }}>
                        <div style={{ fontWeight: 700, color: cfg.color, fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <StIcon size={13} color={cfg.color} strokeWidth={2} /> {s.name}
                        </div>
                        <div style={{ color: '#888', fontSize: 10 }}>{cfg.label}</div>
                        <div style={{ color: '#888', fontSize: 10, fontFamily: 'monospace', marginTop: 4 }}>
                          {s.latitude?.toFixed(5)}, {s.longitude?.toFixed(5)}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Layer B — Incident pins */}
              {incidents.filter(i => i.latitude != null && i.status !== 'RESOLVED').map(i => (
                <Marker key={`inc-${i.id}`} position={[i.latitude, i.longitude]} icon={makeIncidentIcon(i.incidentType)}>
                  <Popup>
                    <div style={{ minWidth: 155 }}>
                      <div style={{ fontWeight: 700, color: INCIDENT_TYPE_COLORS[i.incidentType] || '#888', fontSize: 12, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <AlertTriangle size={11} /> {i.incidentType?.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Severity: {i.severity} · {i.status}</div>
                      <div style={{ fontSize: 10, color: '#888', fontFamily: 'monospace' }}>
                        {i.latitude?.toFixed(5)}, {i.longitude?.toFixed(5)}
                      </div>
                      {i.createdAt && <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>{ago(i.createdAt)}</div>}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Layer C — Route polylines: EN_ROUTE vehicle → incident */}
              {vehicles.filter(v => v.status === 'EN_ROUTE' && v.activeIncidentId).map(v => {
                const pos = vehiclePos(v);
                const inc = incidentById[String(v.activeIncidentId)];
                if (!pos || !inc?.latitude) return null;
                return (
                  <Polyline
                    key={`route-${v.id}`}
                    positions={[pos, [inc.latitude, inc.longitude]]}
                    pathOptions={{ color: '#F59E0B', weight: 2, opacity: 0.7, dashArray: '8 6' }}
                  />
                );
              })}

              {/* Layer D — Vehicle markers */}
              {vehicles.map(v => {
                const pos  = vehiclePos(v);
                if (!pos) return null;
                const color = VEHICLE_STATUS_COLORS[v.status] || '#888';
                const isSel = v.id === selectedId;
                const noGps = v.currentLat == null;
                return (
                  <Marker
                    key={`v-${v.id}`}
                    position={pos}
                    icon={makeVehicleIcon(color, isSel, v.vehicleType, noGps)}
                    eventHandlers={{ click: () => setSelectedId(v.id === selectedId ? null : v.id) }}
                  >
                    <Popup>
                      <div style={{ minWidth: 155 }}>
                        <div style={{ fontWeight: 700, color, fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <VehicleIcon type={v.vehicleType} size={14} color={color} /> {v.registration}
                        </div>
                        <div style={{ color: '#555', fontSize: 11, marginBottom: 6 }}>
                          {TLABEL[v.vehicleType] || v.vehicleType}
                          {noGps && <span style={{ color: '#F59E0B', marginLeft: 6 }}>· at station</span>}
                        </div>
                        {!noGps && (
                          <div style={{ fontSize: 10, color: '#888', fontFamily: 'monospace', marginBottom: 6 }}>
                            {v.currentLat?.toFixed(5)}, {v.currentLng?.toFixed(5)}
                          </div>
                        )}
                        <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}22`, padding: '2px 8px', borderRadius: 4, border: `1px solid ${color}44` }}>
                          {v.status}
                        </span>
                        {v.activeIncidentId && (
                          <div style={{ color: '#888', fontSize: 10, marginTop: 6 }}>Incident · {v.activeIncidentId.slice(0, 8)}</div>
                        )}
                        {v.updatedAt && <div style={{ color: '#888', fontSize: 10, marginTop: 4 }}>{ago(v.updatedAt)}</div>}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
