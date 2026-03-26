import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Constants ──────────────────────────────────────────────────────────────
const VEHICLE_ICONS  = { AMBULANCE: '🚑', POLICE_CAR: '🚓', FIRE_TRUCK: '🚒', PATROL_BIKE: '🏍️' };
const STATUS_COLORS  = {
  IDLE:       '#10B981',
  DISPATCHED: '#22D3EE',
  EN_ROUTE:   '#F97316',
  ON_SCENE:   '#EF4444',
  RETURNING:  '#F59E0B',
};
const GHANA_CENTER   = [7.9465, -1.0232];
const GHANA_BOUNDS   = [[4.5, -3.5], [11.5, 1.5]];
const ACTIVE_STATUS  = new Set(['EN_ROUTE', 'ON_SCENE', 'DISPATCHED']);

// ── Custom marker factory ──────────────────────────────────────────────────
function buildIcon(vehicle, isSelected) {
  const color   = STATUS_COLORS[vehicle.status] || '#888';
  const emoji   = VEHICLE_ICONS[vehicle.vehicleType] || '🚗';
  const size    = isSelected ? 52 : 40;
  const pulse   = ACTIVE_STATUS.has(vehicle.status);

  const pulseRing = pulse ? `
    <div style="
      position:absolute; inset:-6px; border-radius:50%;
      border:2px solid ${color};
      animation:leaflet-pulse 2s ease-in-out infinite;
      opacity:0.7;
    "></div>
    <div style="
      position:absolute; inset:-14px; border-radius:50%;
      border:1.5px solid ${color};
      animation:leaflet-pulse 2s ease-in-out infinite;
      animation-delay:0.4s;
      opacity:0.35;
    "></div>` : '';

  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;">
      ${pulseRing}
      <div style="
        width:${size}px; height:${size}px; border-radius:50%;
        background:${color}22;
        border:${isSelected ? 3 : 2}px solid ${color};
        display:flex; align-items:center; justify-content:center;
        font-size:${isSelected ? 24 : 18}px;
        box-shadow:0 0 ${isSelected ? 24 : 12}px ${color}80;
        transition:all 0.2s;
        backdrop-filter:blur(2px);
      ">${emoji}</div>
      ${isSelected ? `
        <div style="
          position:absolute; top:calc(100%+4px); left:50%;
          transform:translateX(-50%);
          background:#0C1225; border:1px solid ${color};
          border-radius:4px; padding:3px 8px; white-space:nowrap;
          font-size:10px; font-weight:700; color:${color};
          font-family:monospace; box-shadow:0 4px 12px rgba(0,0,0,0.6);
          letter-spacing:0.05em;
        ">${vehicle.registration}</div>` : ''}
    </div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize:     [size, isSelected ? size + 28 : size],
    iconAnchor:   [size / 2, size / 2],
    popupAnchor:  [0, -size / 2 - 4],
  });
}

// ── Imperative map layer that manages markers ──────────────────────────────
function MarkerLayer({ vehicles, selectedId, onSelect, routeLines }) {
  const map       = useMap();
  const markersRef = useRef({});   // id → L.Marker
  const polylinesRef = useRef({}); // id → L.Polyline

  // Update markers
  useEffect(() => {
    const currentIds = new Set(vehicles.map(v => v.id));

    // Remove stale markers
    Object.keys(markersRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add / update markers
    vehicles.forEach(v => {
      if (!v.currentLat || !v.currentLng) return;
      const latlng = [v.currentLat, v.currentLng];
      const isSel  = v.id === selectedId;
      const icon   = buildIcon(v, isSel);

      if (markersRef.current[v.id]) {
        markersRef.current[v.id].setLatLng(latlng);
        markersRef.current[v.id].setIcon(icon);
      } else {
        const marker = L.marker(latlng, { icon })
          .addTo(map)
          .on('click', () => onSelect(v.id === selectedId ? null : v.id));
        markersRef.current[v.id] = marker;
      }
    });
  }, [vehicles, selectedId, map, onSelect]);

  // Draw animated polyline routes for active vehicles
  useEffect(() => {
    // Remove old
    Object.values(polylinesRef.current).forEach(p => p.remove());
    polylinesRef.current = {};

    routeLines.forEach(({ id, points, color }) => {
      if (points.length < 2) return;
      const pl = L.polyline(points, {
        color,
        weight: 2.5,
        opacity: 0.55,
        dashArray: '8 6',
        dashOffset: '0',
      }).addTo(map);
      polylinesRef.current[id] = pl;

      // Animate dash offset
      let offset = 0;
      const anim = setInterval(() => {
        offset = (offset - 1 + 100) % 100;
        pl.setStyle({ dashOffset: String(offset) });
      }, 60);
      pl._animInterval = anim;
    });

    return () => {
      Object.values(polylinesRef.current).forEach(p => {
        if (p._animInterval) clearInterval(p._animInterval);
        p.remove();
      });
    };
  }, [routeLines, map]);

  return null;
}

// ── Fly-to controller ──────────────────────────────────────────────────────
function FlyController({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 13, { duration: 1.2 });
  }, [target, map]);
  return null;
}

// ── Reset bounds controller ────────────────────────────────────────────────
function ResetController({ trigger }) {
  const map = useMap();
  useEffect(() => {
    if (trigger > 0) map.fitBounds(GHANA_BOUNDS, { padding: [20, 20] });
  }, [trigger, map]);
  return null;
}

// ── Main exported component ────────────────────────────────────────────────
export default function VehicleMap({ vehicles, selectedId, onSelect, flyTarget, resetTrigger }) {
  // Build simulated route lines for active vehicles
  const routeLines = vehicles
    .filter(v => ACTIVE_STATUS.has(v.status) && v.currentLat)
    .map(v => {
      const color = STATUS_COLORS[v.status] || '#888';
      // Generate a short "trail" behind the vehicle using tiny offsets
      const trail = [];
      for (let i = 5; i >= 1; i--) {
        const factor = i * 0.003;
        trail.push([v.currentLat - factor, v.currentLng - factor * 0.6]);
      }
      trail.push([v.currentLat, v.currentLng]);
      return { id: v.id, points: trail, color };
    });

  const handleSelect = useCallback((id) => onSelect(id), [onSelect]);

  return (
    <MapContainer
      center={GHANA_CENTER}
      zoom={7}
      maxBounds={[[0, -8], [16, 6]]}
      maxBoundsViscosity={0.85}
      style={{ width: '100%', height: '100%', background: '#070B18' }}
      zoomControl={false}
      attributionControl={true}
    >
      {/* CartoDB Dark Matter tiles — free, no API key */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      <MarkerLayer
        vehicles={vehicles}
        selectedId={selectedId}
        onSelect={handleSelect}
        routeLines={routeLines}
      />

      {flyTarget && <FlyController target={flyTarget} />}
      <ResetController trigger={resetTrigger} />
    </MapContainer>
  );
}
