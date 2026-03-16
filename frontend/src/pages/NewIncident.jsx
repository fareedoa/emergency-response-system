import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentApi } from '../api';
import { PageHeader, Btn, Card, Field, Input, Select, Textarea, SectionTitle } from '../components/UI';
import { INCIDENT_TYPES, SEVERITY_LEVELS, getTypeInfo } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Ghana bounding box for validation
const GH_BOUNDS = { minLat:4.5, maxLat:11.5, minLng:-3.5, maxLng:1.5 };

export default function NewIncident() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [form, setForm] = useState({
    citizenName: '', incidentType: '', otherIncidentType: '', severity: '', latitude: '', longitude: '', notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  // Load Google Maps
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!apiKey) { setMapLoaded(false); return; }
    if (window.google?.maps) { initMap(); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => { setMapLoaded(true); };
    document.head.appendChild(script);
    return () => {};
  }, []);

  useEffect(() => { if (mapLoaded) initMap(); }, [mapLoaded]);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google) return;
    const center = { lat: 5.6037, lng: -0.1870 }; // Accra
    const map = new window.google.maps.Map(mapRef.current, {
      center, zoom: 11,
      styles: [ // Dark map style
        { elementType:'geometry', stylers:[{color:'#0c1225'}] },
        { elementType:'labels.text.fill', stylers:[{color:'#7b92b8'}] },
        { elementType:'labels.text.stroke', stylers:[{color:'#0c1225'}] },
        { featureType:'road', elementType:'geometry', stylers:[{color:'#162040'}] },
        { featureType:'road.highway', elementType:'geometry', stylers:[{color:'#1c2b50'}] },
        { featureType:'water', elementType:'geometry', stylers:[{color:'#070b18'}] },
        { featureType:'poi', stylers:[{visibility:'off'}] },
      ],
    });
    mapInstanceRef.current = map;

    // Click to place marker
    map.addListener('click', (e) => {
      placeMarker(e.latLng, map);
    });

    // Places autocomplete
    const input = document.getElementById('location-search');
    if (input) {
      const autocomplete = new window.google.maps.places.Autocomplete(input, {
        bounds: new window.google.maps.LatLngBounds(
          { lat: GH_BOUNDS.minLat, lng: GH_BOUNDS.minLng },
          { lat: GH_BOUNDS.maxLat, lng: GH_BOUNDS.maxLng }
        ),
        componentRestrictions: { country: 'gh' },
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          map.setCenter(place.geometry.location);
          map.setZoom(15);
          placeMarker(place.geometry.location, map);
        }
      });
    }
  }, []);

  const placeMarker = (latlng, map) => {
    if (markerRef.current) markerRef.current.setMap(null);
    const marker = new window.google.maps.Marker({
      position: latlng,
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#F59E0B',
        fillOpacity: 1,
        strokeColor: '#000',
        strokeWeight: 2,
      },
      animation: window.google.maps.Animation.DROP,
    });
    markerRef.current = marker;
    const lat = typeof latlng.lat === 'function' ? latlng.lat() : latlng.lat;
    const lng = typeof latlng.lng === 'function' ? latlng.lng() : latlng.lng;
    setForm(f => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
    setErrors(e => ({ ...e, latitude:'', longitude:'' }));
  };

  const validate = () => {
    const e = {};
    if (!form.citizenName.trim()) e.citizenName = 'Citizen name is required';
    if (!form.incidentType) e.incidentType = 'Incident type is required';
    if (form.incidentType === 'OTHER' && !form.otherIncidentType.trim()) e.otherIncidentType = 'Please describe the incident';
    if (!form.severity) e.severity = 'Severity is required';
    if (!form.latitude || !form.longitude) e.latitude = 'Please select a location on the map';
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
                Search for an address or click on the map to set the incident location.
              </p>

              {/* Search input */}
              <div style={{ position:'relative', marginBottom:14 }}>
                <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <input
                  id="location-search" value={locationSearch} onChange={e=>setLocationSearch(e.target.value)}
                  placeholder="Search location in Ghana..."
                  style={{
                    width:'100%', background:'var(--bg-raised)', border:'1px solid var(--border-subtle)',
                    borderRadius:'var(--r-sm)', padding:'10px 14px 10px 38px', color:'var(--text-primary)', fontSize:13, outline:'none',
                  }}
                  onFocus={e=>{e.target.style.borderColor='var(--amber)';}}
                  onBlur={e=>{e.target.style.borderColor='var(--border-subtle)';}}
                />
              </div>

              {/* Map container */}
              <div style={{ position:'relative', borderRadius:'var(--r-md)', overflow:'hidden', border:'1px solid var(--border-subtle)' }}>
                <div ref={mapRef} style={{ width:'100%', height:340 }} />
                {!window.google && !import.meta.env.VITE_GOOGLE_MAPS_KEY && (
                  <div style={{
                    position:'absolute', inset:0, background:'var(--bg-raised)', display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center', gap:12,
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:600 }}>Google Maps</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Set VITE_GOOGLE_MAPS_KEY in .env</div>
                    </div>
                  </div>
                )}
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
