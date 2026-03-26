import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentApi } from '../api';
import { PageHeader, Btn, Card, Field, Input, Select, Textarea, SectionTitle } from '../components/UI';
import { INCIDENT_TYPES, SEVERITY_LEVELS, getTypeInfo } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { Navigation, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix default Leaflet marker icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom brand-coloured pin
const pinIcon = L.divIcon({
  className: '',
  iconSize:   [32, 42],
  iconAnchor: [16, 42],
  html: `<div style="
    width:32px; height:42px; display:flex; flex-direction:column; align-items:center;
  ">
    <div style="
      width:32px; height:32px; border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      background:var(--color-brand,#f59e0b);
      border:3px solid #000;
      box-shadow:0 4px 14px rgba(245,158,11,0.55);
    "></div>
    <div style="width:2px; height:10px; background:var(--color-brand,#f59e0b); margin-top:0;"></div>
  </div>`,
});

// Component that listens to map clicks
function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

// Nominatim geocoder
async function geocodeNominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gh&limit=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (data.length === 0) throw new Error('Location not found');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name };
}

export default function NewIncident() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    citizenName: '', incidentType: '', otherIncidentType: '', severity: '', latitude: '', longitude: '', notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState([7.95, -1.02]); // Ghana center

  const position = form.latitude && form.longitude
    ? [parseFloat(form.latitude), parseFloat(form.longitude)]
    : null;

  const handleMapClick = (latlng) => {
    setForm(f => ({ ...f, latitude: latlng.lat.toFixed(6), longitude: latlng.lng.toFixed(6) }));
    setErrors(e => ({ ...e, latitude: '' }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!locationSearch.trim()) return;
    setSearching(true);
    try {
      const { lat, lng } = await geocodeNominatim(locationSearch);
      setForm(f => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
      setMapCenter([lat, lng]);
      setErrors(e => ({ ...e, latitude: '' }));
    } catch {
      toast.error('Location not found. Try a different search.');
    } finally { setSearching(false); }
  };

  const validate = () => {
    const e = {};
    if (!form.citizenName.trim()) e.citizenName = 'Citizen name is required';
    if (!form.incidentType)       e.incidentType = 'Incident type is required';
    if (form.incidentType === 'OTHER' && !form.otherIncidentType.trim()) e.otherIncidentType = 'Please describe the incident';
    if (!form.severity)           e.severity = 'Severity is required';
    if (!form.latitude || !form.longitude) e.latitude = 'Click on the map to set a location';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix form errors'); return; }
    setSubmitting(true);
    try {
      const payload = {
        citizenName: form.citizenName,
        incidentType: form.incidentType,
        ...(form.incidentType === 'OTHER' && { otherIncidentType: form.otherIncidentType }),
        severity: form.severity,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        notes: form.notes || null,
      };
      const { data } = await incidentApi.create(payload);
      toast.success(`Incident logged — ${data.status === 'DISPATCHED' ? 'Responder dispatched!' : 'Created, awaiting dispatch'}`);
      navigate(`/incidents/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create incident');
    } finally { setSubmitting(false); }
  };

  const selectedType = INCIDENT_TYPES.find(t => t.value === form.incidentType);

  return (
    <div style={{ animation: 'fadeUp 0.3s ease', maxWidth: 1100, margin: '0 auto' }}>
      <PageHeader
        title="Log Emergency Incident"
        subtitle="Record an emergency report. The system will auto-dispatch the nearest available responder."
        actions={<Btn variant="secondary" onClick={() => navigate('/incidents')}>← Back to Incidents</Btn>}
      />
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          {/* ── LEFT ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card>
              <SectionTitle>Caller Information</SectionTitle>
              <Field label="Citizen Name" required error={errors.citizenName}>
                <Input value={form.citizenName} onChange={e => setForm(f => ({ ...f, citizenName: e.target.value }))} placeholder="Full name of the caller" autoFocus />
              </Field>
            </Card>

            <Card>
              <SectionTitle>Incident Details</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Incident Type" required error={errors.incidentType}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {INCIDENT_TYPES.map(type => {
                      const TypeIcon = type.Icon;
                      const isSelected = form.incidentType === type.value;
                      return (
                        <button key={type.value} type="button"
                          onClick={() => { setForm(f => ({ ...f, incidentType: type.value, otherIncidentType: '' })); setErrors(e => ({ ...e, incidentType: '' })); }}
                          style={{ padding: '10px 8px', borderRadius: 'var(--r-sm)', border: `2px solid ${isSelected ? type.color : 'var(--border-subtle)'}`, background: isSelected ? `color-mix(in srgb, ${type.color} 15%, transparent)` : 'var(--bg-raised)', color: isSelected ? type.color : 'var(--text-secondary)', cursor: 'pointer', transition: 'all var(--ease-fast)', textAlign: 'center' }}
                          onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = type.color + '60'; e.currentTarget.style.background = type.color + '08'; }}}
                          onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-raised)'; }}}>
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, opacity: isSelected ? 1 : 0.6 }}>
                            {TypeIcon && <TypeIcon size={18} strokeWidth={2} />}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em' }}>{type.short}</div>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {form.incidentType === 'OTHER' && (
                  <Field label="Describe Incident" required error={errors.otherIncidentType}>
                    <Input value={form.otherIncidentType} onChange={e => setForm(f => ({ ...f, otherIncidentType: e.target.value }))} placeholder="Describe the type of incident" />
                  </Field>
                )}

                <Field label="Severity Level" required error={errors.severity}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                    {SEVERITY_LEVELS.map(sev => (
                      <button key={sev.value} type="button"
                        onClick={() => { setForm(f => ({ ...f, severity: sev.value })); setErrors(e => ({ ...e, severity: '' })); }}
                        style={{ padding: '9px 6px', borderRadius: 'var(--r-sm)', border: `2px solid ${form.severity === sev.value ? sev.color : 'var(--border-subtle)'}`, background: form.severity === sev.value ? `color-mix(in srgb, ${sev.color} 15%, transparent)` : 'var(--bg-raised)', color: form.severity === sev.value ? sev.color : 'var(--text-secondary)', cursor: 'pointer', transition: 'all var(--ease-fast)', textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                        {sev.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Additional Notes">
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional details from the caller…" rows={3} />
                </Field>
              </div>
            </Card>

            {selectedType && (
              <div style={{ padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--dispatch-soft)', border: '1px solid var(--dispatch-border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Info size={16} color="var(--color-dispatch)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-dispatch)', marginBottom: 3 }}>AUTO-DISPATCH ACTIVE</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {selectedType.value === 'MEDICAL_EMERGENCY' && 'System will dispatch nearest available ambulance and notify closest hospital.'}
                    {selectedType.value === 'FIRE' && 'System will dispatch nearest available fire truck.'}
                    {(selectedType.value === 'CRIME' || selectedType.value === 'ROBBERY') && 'System will dispatch nearest available police unit.'}
                    {selectedType.value === 'ACCIDENT' && 'System will dispatch both ambulance and police to the scene.'}
                    {selectedType.value === 'OTHER' && 'Incident will be created and awaiting manual dispatch.'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT — OpenStreetMap ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 0 }}>
            <Card>
              <SectionTitle>Incident Location</SectionTitle>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, marginTop: -8 }}>
                Search for an address or click the map to pin the incident location.
              </p>

              {/* Geocoder search */}
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Navigation size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    value={locationSearch} onChange={e => setLocationSearch(e.target.value)}
                    placeholder="Search location in Ghana…"
                    style={{ width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)', padding: '9px 12px 9px 34px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-brand)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                  />
                </div>
                <Btn type="submit" size="sm" loading={searching}>Search</Btn>
              </form>

              {/* Map */}
              <div style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', height: 320 }}>
                <MapContainer
                  key={`${mapCenter[0]}-${mapCenter[1]}`}
                  center={mapCenter}
                  zoom={7}
                  style={{ width: '100%', height: '100%' }}
                  attributionControl={true}
                  zoomControl={true}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    subdomains="abcd"
                    maxZoom={19}
                    attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <ClickHandler onMapClick={handleMapClick} />
                  {position && <Marker position={position} icon={pinIcon} />}
                </MapContainer>
              </div>

              {errors.latitude && (
                <div style={{ fontSize: 11, color: 'var(--color-danger)', marginTop: 6 }}>{errors.latitude}</div>
              )}

              {/* Coord display / manual input */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                <Field label="Latitude">
                  <Input type="number" step="any" value={form.latitude}
                    onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
                    placeholder="e.g. 5.6037" />
                </Field>
                <Field label="Longitude">
                  <Input type="number" step="any" value={form.longitude}
                    onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
                    placeholder="e.g. -0.1870" />
                </Field>
              </div>
            </Card>

            <Btn type="submit" size="lg" loading={submitting} style={{ width: '100%', justifyContent: 'center' }}>
              {submitting ? 'DISPATCHING…' : 'SUBMIT & DISPATCH'}
            </Btn>
          </div>
        </div>
      </form>
    </div>
  );
}
