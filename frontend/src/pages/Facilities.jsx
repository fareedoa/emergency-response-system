import { useState, useEffect, useCallback } from 'react';
import { trackingApi } from '../api';
import { PageHeader, Card, DataTable, Btn, Modal, Field, Input, Select } from '../components/UI';
import { STATION_TYPES } from '../utils/constants';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Plus, Navigation, Building2, Trash2 } from 'lucide-react';

// Fix default Leaflet marker icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const GHANA_CENTER = [7.9465, -1.0232];

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

async function geocodeNominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=gh&limit=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (data.length === 0) throw new Error('Location not found');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

export default function Facilities() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', stationType: '', latitude: '', longitude: '' });
  const [locationSearch, setLocationSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(GHANA_CENTER);

  const load = useCallback(() => {
    setLoading(true);
    trackingApi.listStations()
      .then(r => setStations(r.data || []))
      .catch(() => toast.error('Failed to load Facilities'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!locationSearch.trim()) return;
    setSearching(true);
    try {
      const { lat, lng } = await geocodeNominatim(locationSearch);
      setForm(f => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
      setMapCenter([lat, lng]);
    } catch {
      toast.error('Location not found. Try a different search.');
    } finally { setSearching(false); }
  };

  const handleCreate = async () => {
    if (!form.name || !form.stationType || !form.latitude || !form.longitude) {
      toast.error('All fields and location are required');
      return;
    }
    setSaving(true);
    try {
      await trackingApi.createStation({
        name: form.name,
        stationType: form.stationType,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      toast.success('Facility created successfully');
      setModalOpen(false);
      setForm({ name: '', stationType: '', latitude: '', longitude: '' });
      setLocationSearch('');
      setMapCenter(GHANA_CENTER);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create facility');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) return;
    try {
      await trackingApi.deleteStation(id);
      toast.success('Facility deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete facility');
    }
  };

  const cols = [
    { key: 'name', label: 'Facility Name', w: 200, render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'stationType', label: 'Type', w: 180, render: v => {
      const info = STATION_TYPES.find(s => s.value === v);
      const TypeIcon = info?.Icon;
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 12 }}>
          {TypeIcon && <TypeIcon size={13} strokeWidth={1.8} />}
          {v?.replace('_', ' ')}
        </span>
      );
    }},
    { key: 'latitude',  label: 'Lat', w: 120, render: v => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v?.toFixed(4)}</span> },
    { key: 'longitude', label: 'Lng', w: 120, render: v => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v?.toFixed(4)}</span> },
    { key: 'id', label: 'Actions', w: 100, sortable: false, render: id => (
      <Btn variant="danger" size="sm" icon={<Trash2 size={12} />} onClick={() => handleDelete(id)}>Delete</Btn>
    )}
  ];

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <PageHeader
        title="Facilities Management"
        subtitle={`${stations.length} registered facilities`}
        actions={
          <Btn onClick={() => setModalOpen(true)} icon={<Plus size={13} />}>
            Add Facility
          </Btn>
        }
      />

      <Card style={{ padding: 0 }}>
        <DataTable cols={cols} rows={stations} emptyTitle="No facilities found" emptyIcon={<Building2 size={40} />} />
      </Card>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setLocationSearch(''); setMapCenter(GHANA_CENTER); }} title="Create New Facility" maxWidth={600}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Facility Name" required>
            <Input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Ridge Hospital" />
          </Field>

          <Field label="Facility Type" required>
            <Select value={form.stationType} onChange={e => setForm(p => ({...p, stationType: e.target.value}))}>
              <option value="">Select type...</option>
              {STATION_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </Field>

          <Field label="Location" required>
            {/* Geocoder search */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Navigation size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  value={locationSearch}
                  onChange={e => setLocationSearch(e.target.value)}
                  placeholder="Search location in Ghana…"
                  style={{ width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)', padding: '9px 12px 9px 34px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-brand)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(e); } }}
                />
              </div>
              <Btn type="button" size="sm" loading={searching} onClick={handleSearch}>Search</Btn>
            </div>

            {/* Map */}
            <div style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', height: 260, marginBottom: 8 }}>
              <MapContainer
                key={`${mapCenter[0]}-${mapCenter[1]}`}
                center={mapCenter}
                zoom={mapCenter === GHANA_CENTER ? 7 : 13}
                style={{ width: '100%', height: '100%' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  subdomains="abcd"
                  maxZoom={19}
                />
                <ClickHandler onMapClick={ll => setForm(f => ({ ...f, latitude: ll.lat.toFixed(6), longitude: ll.lng.toFixed(6) }))} />
                {form.latitude && form.longitude && <Marker position={[parseFloat(form.latitude), parseFloat(form.longitude)]} />}
              </MapContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input type="number" value={form.latitude}  onChange={e => setForm(p => ({...p, latitude:  e.target.value}))} placeholder="Latitude"  step="any" />
              <Input type="number" value={form.longitude} onChange={e => setForm(p => ({...p, longitude: e.target.value}))} placeholder="Longitude" step="any" />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Search for an address or click the map to pin the location.</p>
          </Field>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8, borderTop: '1px solid var(--border-faint)', paddingTop: 16 }}>
            <Btn variant="secondary" onClick={() => { setModalOpen(false); setLocationSearch(''); setMapCenter(GHANA_CENTER); }}>Cancel</Btn>
            <Btn onClick={handleCreate} loading={saving}>Create Facility</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
