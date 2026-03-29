import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { incidentApi, trackingApi } from '../api';
import { PageHeader, Btn, Card, StatusBadge, SeverityBadge, TypeBadge, Modal, SectionTitle, Spinner, Empty } from '../components/UI';
import { NEXT_STATUS, INCIDENT_STATUSES, getTypeInfo, getStatusInfo, fmtDateTime, timeAgo } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useTrackingSocket } from '../hooks/useTrackingSocket';
import toast from 'react-hot-toast';
import { VehicleIcon } from '../components/UI';
import { AlertTriangle, ClipboardList, Send, Check } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

// Custom marker for showing incident position
const incidentPin = L.divIcon({
  html: `
    <div style="
      position:relative; width:40px; height:40px;
    ">
      <div style="
        position:absolute; inset:-10px; border-radius:50%;
        border:2px solid var(--red); animation:pulse 2s ease-in-out infinite; opacity:0.5;
      "></div>
      <div style="
        width:40px; height:40px; border-radius:50%; background:var(--red-soft);
        border:2px solid var(--red); backdrop-filter:blur(4px); box-shadow:0 0 16px rgba(239,68,68,0.4);
        display:flex; align-items:center; justify-content:center;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      </div>
    </div>
  `,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const VEHICLE_SVG = {
  AMBULANCE:   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><path d="M5 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/><path d="M17 18a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/><path d="M8 8v4"/><path d="M6 10h4"/></svg>`,
  FIRE_TRUCK:  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  POLICE_CAR:  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  PATROL_BIKE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`,
};
const VEHICLE_SVG_DEFAULT = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect width="9" height="11" x="11" y="11" rx="1"/><circle cx="17.5" cy="21.5" r="2.5"/><circle cx="6.5" cy="21.5" r="2.5"/></svg>`;

const vehiclePin = (vehicleType, status) => {
  const svg = VEHICLE_SVG[vehicleType] || VEHICLE_SVG_DEFAULT;
  const color = status === 'EN_ROUTE' ? 'var(--color-warning)' : status === 'ON_SCENE' ? 'var(--color-danger)' : 'var(--color-brand)';
  return L.divIcon({
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div style="
      width:34px; height:34px; border-radius:50%;
      background:color-mix(in srgb, ${color} 88%, #0e1527);
      border:2px solid ${color};
      box-shadow:0 0 10px ${color}88;
      display:flex; align-items:center; justify-content:center;
      animation:${['EN_ROUTE','ON_SCENE'].includes(status) ? 'pulse 2s ease-in-out infinite' : 'none'};
    ">${svg}</div>`,
  });
};

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isAnyAdmin } = useAuth();
  const [incident, setIncident] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dispatchModal, setDispatchModal] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [assignedVehicle, setAssignedVehicle] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState('');

  const load = async () => {
    try {
      const [incRes, tlRes] = await Promise.allSettled([incidentApi.get(id), incidentApi.timeline(id)]);
      let incidentData = null;
      if (incRes.status === 'fulfilled') {
          incidentData = incRes.value.data;
          setIncident(incidentData);
      }
      if (tlRes.status === 'fulfilled') setTimeline(tlRes.value.data || []);
      
      if (incidentData && incidentData.assignedUnit) {
          try {
              const vRes = await trackingApi.getVehicle(incidentData.assignedUnit);
              setAssignedVehicle(vRes.data);
          } catch (e) { console.warn('Failed to load assigned vehicle'); }
      }
    } catch { toast.error('Failed to load incident'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  useTrackingSocket((update) => {
    if (assignedVehicle && update.vehicleId === assignedVehicle.id) {
       setAssignedVehicle(prev => ({ ...prev, currentLat: update.latitude, currentLng: update.longitude, status: update.status || prev.status }));
    }
  });

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await incidentApi.updateStatus(id, newStatus);
      toast.success(`Status → ${newStatus.replace('_', ' ')}`);
      setStatusModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update status'); }
    finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await incidentApi.delete(id);
      toast.success('Incident deleted');
      navigate('/incidents');
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const handleOpenDispatch = async () => {
    setDispatchModal(true);
    try {
      const res = await trackingApi.listVehicles();
      setVehicles(res.data || []);
    } catch { toast.error('Failed to load vehicles'); }
  };

  const handleDispatch = async () => {
    if (!selectedUnit) return;
    setDispatching(true);
    try {
      await incidentApi.assign(id, selectedUnit);
      toast.success('Unit assigned successfully');
      setDispatchModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Dispatch failed'); }
    finally { setDispatching(false); }
  };

  if (loading) return <Spinner />;
  if (!incident) return <Empty icon={<AlertTriangle size={40} />} title="Incident not found" msg="The incident may have been deleted or the ID is invalid." action={<Btn variant="secondary" onClick={() => navigate('/incidents')}>← Back to Incidents</Btn>} />;

  const typeInfo = getTypeInfo(incident.incidentType);
  const nextStatuses = NEXT_STATUS[incident.status] || [];
  const statusSteps = ['CREATED', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED'];
  const currentStep = statusSteps.indexOf(incident.status);

  return (
    <div style={{ animation: 'fadeUp 0.3s ease', maxWidth: 1020, margin: '0 auto' }}>
      <PageHeader
        title="Incident Report"
        subtitle={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>ID: {incident.id}</span>}
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            {isAnyAdmin() && (
              <Btn variant="ghost" size="sm" onClick={handleOpenDispatch}
                icon={<Send size={13} />}
              >Manual Dispatch</Btn>
            )}
            {nextStatuses.length > 0 && (
              <Btn variant="dispatch" onClick={() => { setNewStatus(nextStatuses[0]); setStatusModal(true); }}
                icon={<Check size={13} />}
              >Update Status</Btn>
            )}
            {isAdmin() && incident.status !== 'RESOLVED' && (
              <Btn variant="danger" size="sm" onClick={() => setDeleteModal(true)}>Delete</Btn>
            )}
            <Btn variant="secondary" onClick={() => navigate('/incidents')}>← Back</Btn>
          </div>
        }
      />

      {/* ── Status Progress ── */}
      <Card style={{ marginBottom: 20, padding: '20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {statusSteps.map((step, i) => {
            const done = i <= currentStep;
            const active = i === currentStep;
            const info = getStatusInfo(step);
            const color = info.color;
            return (
              <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < statusSteps.length - 1 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    border: `2px solid ${done ? color : 'var(--border-subtle)'}`,
                    background: active ? color : done ? `color-mix(in srgb, ${color} 18%, transparent)` : 'var(--bg-raised)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                    boxShadow: active ? `0 0 20px color-mix(in srgb, ${color} 45%, transparent)` : 'none',
                    animation: active ? 'pulseBig 2s ease-in-out infinite' : 'none',
                  }}>
                    {i < currentStep
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : <div style={{ width: 8, height: 8, borderRadius: '50%', background: done ? (active ? 'var(--on-brand)' : color) : 'var(--border-normal)' }} />
                    }
                  </div>
                  <span style={{ fontSize: 9, fontWeight: active ? 800 : 500, color: done ? color : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                    {step.replace('_', ' ')}
                  </span>
                </div>
                {i < statusSteps.length - 1 && (
                  <div style={{ flex: 1, height: 2, margin: '0 8px', marginBottom: 24,
                    background: i < currentStep ? color : 'var(--border-subtle)',
                    transition: 'background 0.4s', borderRadius: 1,
                    boxShadow: i < currentStep ? `0 0 8px color-mix(in srgb, ${color} 40%, transparent)` : 'none',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header card */}
          <Card glowColor={typeInfo.color}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 54, height: 54, borderRadius: 'var(--r-md)', background: `color-mix(in srgb, ${typeInfo.color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${typeInfo.color} 28%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {typeInfo.Icon && <typeInfo.Icon size={26} color={typeInfo.color} strokeWidth={1.6} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, flexWrap: 'wrap' }}>
                  <TypeBadge type={incident.incidentType} />
                  <StatusBadge status={incident.status} />
                  <SeverityBadge severity={incident.severity} />
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, marginBottom: 5 }}>
                  {incident.incidentType === 'OTHER' ? incident.otherIncidentType : typeInfo.label}
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Reported {timeAgo(incident.createdAt)} · {fmtDateTime(incident.createdAt)}
                </p>
              </div>
            </div>
          </Card>

          {/* Info grid */}
          <Card>
            <SectionTitle>Incident Information</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {[
                { label: 'Citizen Name',   value: incident.citizenName },
                { label: 'Reported By',    value: incident.createdBy || '—' },
                { label: 'Incident Type',  value: typeInfo.label },
                { label: 'Severity',       value: incident.severity },
                { label: 'Latitude',       value: incident.latitude?.toFixed(6) },
                { label: 'Longitude',      value: incident.longitude?.toFixed(6) },
                { label: 'Assigned Unit',  value: incident.assignedUnit || 'Awaiting dispatch' },
                { label: 'Hospital ID',    value: incident.hospitalId || '—' },
              ].map((item, i) => (
                <div key={item.label} style={{ padding: '14px 16px', borderBottom: i < 6 ? '1px solid var(--border-faint)' : 'none', borderRight: i % 2 === 0 ? '1px solid var(--border-faint)' : 'none' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: item.label === 'Assigned Unit' && !incident.assignedUnit ? 'var(--color-warning)' : 'var(--text-primary)', fontFamily: item.label.includes('tude') || item.label.includes('Unit') ? 'var(--font-mono)' : 'inherit', fontWeight: item.label === 'Assigned Unit' && incident.assignedUnit ? 600 : 400 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Notes */}
          {incident.notes && (
            <Card>
              <SectionTitle>Operator Notes</SectionTitle>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75, padding: '14px 18px', background: 'var(--bg-raised)', borderRadius: 'var(--r-md)', borderLeft: '3px solid var(--color-brand)' }}>
                {incident.notes}
              </p>
            </Card>
          )}

          {/* Location (coordinate display) */}
          {incident.latitude && incident.longitude && (
            <Card>
              <SectionTitle>Incident Location</SectionTitle>
              <div style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', height: 260, background: 'var(--bg-raised)', position: 'relative' }}>
                <MapContainer center={[incident.latitude, incident.longitude]} zoom={13} style={{ width: '100%', height: '100%' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <Marker position={[incident.latitude, incident.longitude]} icon={incidentPin} />
                  {assignedVehicle && assignedVehicle.currentLat && (
                    <Marker position={[assignedVehicle.currentLat, assignedVehicle.currentLng]} icon={vehiclePin(assignedVehicle.vehicleType, assignedVehicle.status)} />
                  )}
                </MapContainer>
              </div>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-danger)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
                </div>
                <div style={{ marginTop: 8 }}>
                  <a href={`https://maps.google.com/?q=${incident.latitude},${incident.longitude}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, color: 'var(--color-dispatch)', textDecoration: 'none', background: 'var(--dispatch-soft)', border: '1px solid var(--dispatch-border)', padding: '6px 14px', borderRadius: 'var(--r-full)' }}>
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right — timeline */}
        <div>
          <Card>
            <SectionTitle>Incident Timeline</SectionTitle>
            {timeline.length === 0
              ? <Empty icon={<ClipboardList size={40} />} title="No timeline yet" msg="Events will appear here as the incident progresses." />
              : (
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 15, top: 8, bottom: 8, width: 1, background: 'var(--border-subtle)' }} />
                  {timeline.map((event, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 20, position: 'relative' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-base)', border: `2px solid var(--color-brand)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-brand)' }} />
                      </div>
                      <div style={{ paddingTop: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                          {event.fieldName || event.action || 'Status change'}
                        </div>
                        {event.oldValue && (
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{event.oldValue}</span>
                            {event.newValue && <span> → <span style={{ color: 'var(--color-dispatch)', fontWeight: 600 }}>{event.newValue}</span></span>}
                          </div>
                        )}
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                          {fmtDateTime(event.revisionDate || event.timestamp)} · {event.modifiedBy || 'System'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </Card>
        </div>
      </div>

      {/* Status update modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Incident Status">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            Current status: <StatusBadge status={incident.status} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {nextStatuses.map(s => {
              const info = INCIDENT_STATUSES.find(x => x.value === s);
              const isSelected = newStatus === s;
              return (
                <button key={s} type="button" onClick={() => setNewStatus(s)}
                  style={{
                    padding: '13px 16px', borderRadius: 'var(--r-md)', textAlign: 'left',
                    border: `2px solid ${isSelected ? info.color : 'var(--border-subtle)'}`,
                    background: isSelected ? `color-mix(in srgb, ${info.color} 14%, transparent)` : 'var(--bg-raised)',
                    color: isSelected ? info.color : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all var(--ease-fast)',
                    display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-display)',
                  }}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = info.color; e.currentTarget.style.color = info.color; }}}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: info.color, flexShrink: 0 }} />
                  {s.replace('_', ' ')}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border-faint)', paddingTop: 16 }}>
            <Btn variant="secondary" onClick={() => setStatusModal(false)}>Cancel</Btn>
            <Btn onClick={handleStatusUpdate} loading={updating} disabled={!newStatus}>Confirm Update</Btn>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Incident">
        <div style={{ padding: '0 0 4px' }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.6 }}>
            Are you sure you want to permanently delete this incident? This action <strong style={{ color: 'var(--color-danger)' }}>cannot be undone</strong>.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>Incident ID: {incident.id}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="secondary" onClick={() => setDeleteModal(false)}>Cancel</Btn>
            <Btn variant="danger" onClick={handleDelete} loading={deleting}>Delete Permanently</Btn>
          </div>
        </div>
      </Modal>

      {/* Manual Dispatch Modal */}
      <Modal open={dispatchModal} onClose={() => setDispatchModal(false)} title="Manual Unit Dispatch">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Select an available unit to dispatch to this incident.
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
            {vehicles.filter(v => ['AVAILABLE', 'IDLE', 'PATROLLING'].includes(v.status)).length === 0 ? (
              <Empty icon={<VehicleIcon type="POLICE_CAR" size={40} />} title="No available units" msg="There are currently no idle or patrolling units to dispatch." />
            ) : (
              vehicles.filter(v => ['AVAILABLE', 'IDLE', 'PATROLLING'].includes(v.status)).map(v => (
                <button key={v.id} type="button" onClick={() => setSelectedUnit(v.id)}
                  style={{
                    padding: '12px', borderRadius: 'var(--r-md)', textAlign: 'left',
                    border: `2px solid ${selectedUnit === v.id ? 'var(--color-brand)' : 'var(--border-subtle)'}`,
                    background: selectedUnit === v.id ? 'var(--brand-soft)' : 'var(--bg-raised)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s',
                  }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <VehicleIcon type={v.vehicleType} size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{v.registration}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v.vehicleType?.replace('_', ' ')} · {v.status}</div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border-faint)', paddingTop: 16 }}>
            <Btn variant="secondary" onClick={() => setDispatchModal(false)}>Cancel</Btn>
            <Btn onClick={handleDispatch} loading={dispatching} disabled={!selectedUnit}>Dispatch Unit</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
