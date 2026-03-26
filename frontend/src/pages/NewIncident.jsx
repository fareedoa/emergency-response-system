import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentApi } from '../api';
import { PageHeader, Btn, Card, Field, Input, Textarea, SectionTitle } from '../components/UI';
import { INCIDENT_TYPES, SEVERITY_LEVELS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Ghana initial center
const GH_CENTER = [5.6037, -0.1870]; // Accra

// Custom marker for placing an incident pin
const pinIcon = L.divIcon({
  html: `
    <div style="
      position:relative; width:32px; height:32px;
    ">
      <div style="
        position:absolute; bottom:0; left:50%; transform:translate(-50%, 50%);
        width:12px; height:4px; border-radius:50%; background:rgba(0,0,0,0.5); filter:blur(2px);
      "></div>
      <div style="
        width:32px; height:32px; border-radius:50%; background:var(--amber);
        border:4px solid white; box-shadow:0 4px 14px rgba(245,158,11,0.6);
        display:flex; align-items:center; justify-content:center;
      ">
        <div style="width:10px; height:10px; border-radius:50%; background:white;"></div>
      </div>
    </div>
  `,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function LocationPicker({ setForm, setErrors, position }) {
  useMapEvents({
    click(e) {
      setForm(f => ({ ...f, latitude: e.latlng.lat.toFixed(6), longitude: e.latlng.lng.toFixed(6) }));
      setErrors(errs => ({ ...errs, latitude: '', longitude: '' }));
    }
  });

  return position ? <Marker position={position} icon={pinIcon} /> : null;
}

export default function NewIncident() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [form, setForm] = useState({
    citizenName: '', incidentType: '', otherIncidentType: '', severity: '', latitude: '', longitude: '', notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.citizenName.trim()) e.citizenName = 'Citizen name is required';
    if (!form.incidentType) e.incidentType = 'Incident type is required';
    if (form.incidentType === 'OTHER' && !form.otherIncidentType.trim()) e.otherIncidentType = 'Please describe the incident';
    if (!form.severity) e.severity = 'Severity is required';
    if (!form.latitude || !form.longitude) e.latitude = 'Please click on the map to set a location';
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
  const position = form.latitude && form.longitude ? [parseFloat(form.latitude), parseFloat(form.longitude)] : null;

  return (
    <div style={{ animation:'fadeUp 0.3s ease', maxWidth:1100, margin:'0 auto' }}>
      <PageHeader
        title="Log Emergency Incident"
        subtitle="Record an emergency report. The system will auto-dispatch the nearest available responder."
        actions={<Btn variant="secondary" onClick={() => navigate('/incidents')}>← Back to Incidents</Btn>}
      />

      <form onSubmit={handleSubmit}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>

          {/* Left — incident details */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Citizen Info */}
            <Card>
              <SectionTitle>Caller Information</SectionTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <Field label="Citizen Name" required error={errors.citizenName}>
                  <Input
                    value={form.citizenName} onChange={e => setForm(f=>({...f,citizenName:e.target.value}))}
                    placeholder="Full name of the caller" autoFocus
                  />
                </Field>
              </div>
            </Card>

            {/* Incident Details */}
            <Card>
              <SectionTitle>Incident Details</SectionTitle>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Type selector — visual cards */}
                <Field label="Incident Type" required error={errors.incidentType}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                    {INCIDENT_TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => { setForm(f=>({...f,incidentType:type.value,otherIncidentType:''})); setErrors(e=>({...e,incidentType:''})); }}
                        style={{
                          padding:'10px 8px', borderRadius:'var(--r-sm)', border:`2px solid`,
                          borderColor: form.incidentType===type.value ? type.color : 'var(--border-subtle)',
                          background: form.incidentType===type.value ? `${type.color}15` : 'var(--bg-raised)',
                          color: form.incidentType===type.value ? type.color : 'var(--text-secondary)',
                          cursor:'pointer', transition:'all var(--ease-fast)', textAlign:'center',
                        }}
                        onMouseEnter={e => { if (form.incidentType!==type.value) { e.currentTarget.style.borderColor=type.color+'60'; e.currentTarget.style.background=type.color+'08'; }}}
                        onMouseLeave={e => { if (form.incidentType!==type.value) { e.currentTarget.style.borderColor='var(--border-subtle)'; e.currentTarget.style.background='var(--bg-raised)'; }}}
                      >
                        <div style={{ fontSize:20, marginBottom:4 }}>{type.icon}</div>
                        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.04em' }}>{type.short}</div>
                      </button>
                    ))}
                  </div>
                </Field>

                {form.incidentType === 'OTHER' && (
                  <Field label="Describe Incident" required error={errors.otherIncidentType}>
                    <Input value={form.otherIncidentType} onChange={e=>setForm(f=>({...f,otherIncidentType:e.target.value}))} placeholder="Describe the type of incident" />
                  </Field>
                )}

                <Field label="Severity Level" required error={errors.severity}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                    {SEVERITY_LEVELS.map(sev => (
                      <button
                        key={sev.value} type="button"
                        onClick={() => { setForm(f=>({...f,severity:sev.value})); setErrors(e=>({...e,severity:''})); }}
                        style={{
                          padding:'9px 6px', borderRadius:'var(--r-sm)', border:`2px solid`,
                          borderColor: form.severity===sev.value ? sev.color : 'var(--border-subtle)',
                          background: form.severity===sev.value ? `${sev.color}15` : 'var(--bg-raised)',
                          color: form.severity===sev.value ? sev.color : 'var(--text-secondary)',
                          cursor:'pointer', transition:'all var(--ease-fast)', textAlign:'center',
                          fontSize:11, fontWeight:700, letterSpacing:'0.06em',
                        }}
                      >
                        {sev.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Additional Notes">
                  <Textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Any additional details from the caller..." rows={3} />
                </Field>
              </div>
            </Card>

            {/* Auto-dispatch notice */}
            {selectedType && (
              <div style={{
                padding:'14px 16px', borderRadius:'var(--r-md)',
                background:'var(--cyan-soft)', border:'1px solid var(--cyan-border)',
                display:'flex', gap:12, alignItems:'flex-start',
              }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{selectedType.icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--cyan)', marginBottom:3 }}>AUTO-DISPATCH ACTIVE</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
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

          {/* Right — map */}
          <div style={{ display:'flex', flexDirection:'column', gap:16, position:'sticky', top:0 }}>
            <Card>
              <SectionTitle>Incident Location</SectionTitle>
              <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14, marginTop:-8 }}>
                Click directly on the map to perfectly place the incident pin.
              </p>

              {/* Map container */}
              <div style={{ position:'relative', borderRadius:'var(--r-md)', overflow:'hidden', border:'1px solid var(--border-subtle)' }}>
                <div style={{ width:'100%', height:340 }}>
                  <MapContainer
                    center={GH_CENTER}
                    zoom={12}
                    style={{ width: '100%', height: '100%', background: '#070B18' }}
                    attributionControl={false}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      subdomains="abcd"
                      maxZoom={19}
                    />
                    <LocationPicker setForm={setForm} setErrors={setErrors} position={position} />
                  </MapContainer>
                </div>
              </div>

              {/* Coordinate display */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:14 }}>
                <Field label="Latitude" error={errors.latitude}>
                  <Input
                    type="number" step="any" value={form.latitude}
                    onChange={e=>setForm(f=>({...f,latitude:e.target.value}))}
                    placeholder="e.g. 5.6037"
                  />
                </Field>
                <Field label="Longitude">
                  <Input
                    type="number" step="any" value={form.longitude}
                    onChange={e=>setForm(f=>({...f,longitude:e.target.value}))}
                    placeholder="e.g. -0.1870"
                  />
                </Field>
              </div>
              {errors.latitude && !form.latitude && (
                <div style={{ fontSize:11, color:'var(--red)', marginTop:6 }}>{errors.latitude}</div>
              )}
            </Card>

            {/* Submit */}
            <Btn type="submit" size="lg" loading={submitting} style={{ width:'100%', justifyContent:'center' }}
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>}
            >
              {submitting ? 'DISPATCHING...' : 'SUBMIT & DISPATCH'}
            </Btn>
          </div>
        </div>
      </form>
    </div>
  );
}
