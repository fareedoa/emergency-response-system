import { useState, useEffect, useCallback, useRef } from 'react';
import { trackingApi } from '../api';
import { PageHeader, Card, VehicleStatusBadge, SectionTitle } from '../components/UI';
import { fmtDateTime, VEHICLE_STATUS_COLORS, ROLE_STATION, ROLE_STATION_LABEL } from '../utils/constants';
import { VehicleIcon } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useTrackingSocket } from '../hooks/useTrackingSocket';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_GROUPS = ['IDLE', 'EN_ROUTE', 'ON_SCENE', 'RETURNING', 'DISPATCHED'];

function timeAgo(date) {
  if (!date) return '—';
  const s = Math.round((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 5)  return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s/60)}m ago`;
}

// Build a coloured circle div-icon for each vehicle
function makeVehicleIcon(color, isSelected, vehicleType) {
  const size = isSelected ? 44 : 34;
  const emoji = { AMBULANCE:'🚑', FIRE_TRUCK:'🚒', POLICE_CAR:'🚓' }[vehicleType] || '🚗';
  return L.divIcon({
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size/2, size/2],
    html: `<div style="
      width:${size}px; height:${size}px; border-radius:50%;
      background:color-mix(in srgb, ${color} 88%, #0e1527);
      border:${isSelected ? 3 : 2}px solid ${isSelected ? '#fff' : color};
      box-shadow:0 0 ${isSelected ? 22 : 10}px ${color}88;
      display:flex; align-items:center; justify-content:center;
      font-size:${isSelected ? 20 : 15}px;
      transition:all 0.2s;
      animation:${['EN_ROUTE','ON_SCENE'].includes(vehicleType) ? 'pulse 2s ease-in-out infinite' : 'none'};
    ">${emoji}</div>`,
  });
}

// Sub-component that flies the map to a vehicle position
function MapFlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 13, { duration: 1.2 });
  }, [position, map]);
  return null;
}

export default function Tracking() {
  const { user } = useAuth();
  const stationFilter = ROLE_STATION[user?.role];
  const [vehicles, setVehicles]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter]         = useState('ALL');

  const load = useCallback(() => {
    setLoading(true);
    trackingApi.listVehicles()
      .then(r => {
        const all = r.data || [];
        setVehicles(stationFilter ? all.filter(v => v.stationType === stationFilter) : all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [stationFilter]);

  useEffect(() => { load(); }, [load]);

  // Poll every 15s as fallback
  useEffect(() => {
    const id = setInterval(() => load(), 15000);
    return () => clearInterval(id);
  }, [load]);

  // WebSocket: patch vehicles in-place on location update
  useTrackingSocket((update) => {
    setVehicles(prev => prev.map(v =>
      (v.id === update.vehicleId)
        ? { ...v, currentLat: update.latitude, currentLng: update.longitude, status: update.status || v.status, updatedAt: update.updatedAt }
        : v
    ));
  });

  const filtered = vehicles.filter(v => filter === 'ALL' || v.status === filter);
  const selected = vehicles.find(v => v.id === selectedId);
  const flyTarget = selected?.currentLat ? [selected.currentLat, selected.currentLng] : null;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <PageHeader title="Live Tracking" subtitle="Real-time vehicle position monitoring — updates every 10 seconds" />

      {/* Status filter pills */}
      <Card style={{ marginBottom: 20, padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setFilter('ALL')}
            style={{ padding: '5px 14px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', borderColor: filter === 'ALL' ? 'var(--border-normal)' : 'transparent', background: filter === 'ALL' ? 'var(--bg-raised)' : 'transparent', color: filter === 'ALL' ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            ALL · {vehicles.length}
          </button>
          {STATUS_GROUPS.map(s => {
            const count = vehicles.filter(v => v.status === s).length;
            const color = VEHICLE_STATUS_COLORS[s] || 'var(--text-muted)';
            const isActive = filter === s;
            return (
              <button key={s} onClick={() => setFilter(filter === s ? 'ALL' : s)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', border: '1px solid', borderColor: isActive ? color : 'transparent', background: isActive ? `color-mix(in srgb, ${color} 14%, transparent)` : 'transparent', color: count > 0 ? color : 'var(--text-muted)' }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: count > 0 ? color : 'var(--border-normal)', animation: (['EN_ROUTE','ON_SCENE'].includes(s) && count > 0) ? 'pulse 1.8s ease-in-out infinite' : 'none' }} />
                {s.replace('_', ' ')} · {count}
              </button>
            );
          })}
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Role scope badge */}
            <span style={{
              fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.07em',
              padding: '3px 10px', borderRadius: 'var(--r-full)',
              background: stationFilter ? 'color-mix(in srgb, var(--color-warning) 12%, transparent)' : 'color-mix(in srgb, var(--color-brand) 12%, transparent)',
              color: stationFilter ? 'var(--color-warning)' : 'var(--color-brand)',
              border: `1px solid ${stationFilter ? 'color-mix(in srgb, var(--color-warning) 30%, transparent)' : 'color-mix(in srgb, var(--color-brand) 30%, transparent)'}`,
            }}>
              🏗️ {ROLE_STATION_LABEL[user?.role] || 'All Stations'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{vehicles.length} vehicles</span>
          </span>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Vehicle list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-faint)' }}>
              <SectionTitle>Fleet Vehicles</SectionTitle>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -12 }}>{filtered.length} shown</p>
            </div>
            {loading && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Loading vehicles…</div>
            )}
            {!loading && filtered.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No vehicles match the current filter.</div>
            )}
            {filtered.map(v => {
              const color = VEHICLE_STATUS_COLORS[v.status] || 'var(--text-secondary)';
              const isSel = v.id === selectedId;
              const isLive = v.status === 'EN_ROUTE' || v.status === 'ON_SCENE';
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedId(isSel ? null : v.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 18px', cursor: 'pointer', background: isSel ? 'var(--bg-hover)' : 'transparent', borderBottom: '1px solid var(--border-faint)', borderLeft: isSel ? `3px solid ${color}` : '3px solid transparent', transition: 'all var(--ease-fast)' }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--bg-raised)'; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ flexShrink: 0, fontSize: 22 }}><VehicleIcon type={v.vehicleType} size={22} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginBottom: 2 }}>{v.registration}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{v.vehicleType?.replace('_', ' ')}</div>
                    {v.currentLat && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{v.currentLat?.toFixed(4)}, {v.currentLng?.toFixed(4)}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isLive && <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, animation: 'pulse 1.5s ease-in-out infinite' }} />}
                      <span style={{ fontSize: 9, fontWeight: 700, color, background: `color-mix(in srgb, ${color} 13%, transparent)`, padding: '2px 7px', borderRadius: 'var(--r-full)', textTransform: 'uppercase', letterSpacing: '0.08em', border: `1px solid color-mix(in srgb, ${color} 28%, transparent)` }}>{v.status}</span>
                    </div>
                    {v.activeIncidentId && <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>INC·{v.activeIncidentId.slice(0, 7)}</div>}
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Vehicle detail panel */}
          {selected && (
            <Card glowColor={VEHICLE_STATUS_COLORS[selected.status]}>
              <SectionTitle>Vehicle Detail</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  ['Registration', selected.registration],
                  ['Type', selected.vehicleType?.replace('_', ' ')],
                  ['Station', selected.stationType?.replace('_', ' ')],
                  ['GPS Lat', selected.currentLat?.toFixed(6)],
                  ['GPS Lng', selected.currentLng?.toFixed(6)],
                  ['Updated', timeAgo(selected.updatedAt)],
                  ['Last Seen', fmtDateTime(selected.updatedAt)],
                  ['Active Incident', selected.activeIncidentId || '—'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12, borderBottom: '1px solid var(--border-faint)', paddingBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{k}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'var(--font-mono)', textAlign: 'right', wordBreak: 'break-all', fontSize: 11 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <VehicleStatusBadge status={selected.status} />
              </div>
            </Card>
          )}
        </div>

        {/* Map panel */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Live Map</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{vehicles.filter(v => v.currentLat).length} vehicles with GPS signal</div>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
              {[['var(--color-warning)','En Route'],['var(--color-danger)','On Scene'],['var(--color-success)','Idle'],['var(--color-dispatch)','Dispatched']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* OSM Map */}
          <div style={{ height: 520 }}>
            <MapContainer center={[7.95, -1.02]} zoom={7} style={{ width: '100%', height: '100%' }} attributionControl zoomControl>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={19}
                attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {flyTarget && <MapFlyTo position={flyTarget} />}
              {vehicles.filter(v => v.currentLat).map(v => {
                const color = VEHICLE_STATUS_COLORS[v.status] || '#888';
                const isSel = v.id === selectedId;
                return (
                  <Marker
                    key={v.id}
                    position={[v.currentLat, v.currentLng]}
                    icon={makeVehicleIcon(color, isSel, v.vehicleType)}
                    eventHandlers={{ click: () => setSelectedId(v.id === selectedId ? null : v.id) }}
                  >
                    <Popup>
                      <div style={{ fontWeight: 700, color, fontSize: 13, marginBottom: 4 }}>{v.registration}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{v.vehicleType?.replace('_', ' ')}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                        {v.currentLat?.toFixed(5)}, {v.currentLng?.toFixed(5)}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color, background: `color-mix(in srgb, ${color} 15%, transparent)`, padding: '2px 8px', borderRadius: 'var(--r-full)', border: `1px solid ${color}40` }}>{v.status}</span>
                      </div>
                      {v.activeIncidentId && (
                        <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 6 }}>INC · {v.activeIncidentId.slice(0, 8)}</div>
                      )}
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
