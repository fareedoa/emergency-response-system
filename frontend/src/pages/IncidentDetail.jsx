import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { incidentApi } from '../api';
import { PageHeader, Btn, Card, StatusBadge, SeverityBadge, TypeBadge, Modal, Select, SectionTitle, Spinner, Empty } from '../components/UI';
import { NEXT_STATUS, INCIDENT_STATUSES, getTypeInfo, fmtDateTime, timeAgo } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [incident, setIncident] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const [incRes, tlRes] = await Promise.allSettled([
        incidentApi.get(id),
        incidentApi.timeline(id),
      ]);
      if (incRes.status === 'fulfilled') setIncident(incRes.value.data);
      if (tlRes.status === 'fulfilled') setTimeline(tlRes.value.data || []);
    } catch { toast.error('Failed to load incident'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await incidentApi.updateStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      setStatusModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await incidentApi.delete(id);
      toast.success('Incident deleted');
      navigate('/incidents');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete incident');
    } finally { setDeleting(false); }
  };

  if (loading) return <Spinner />;
  if (!incident) return <Empty icon="🚨" title="Incident not found" />;

  const typeInfo = getTypeInfo(incident.incidentType);
  const nextStatuses = NEXT_STATUS[incident.status] || [];
  const statusSteps = ['CREATED', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED'];
  const currentStep = statusSteps.indexOf(incident.status);

  const statusColors = { CREATED:'var(--amber)', DISPATCHED:'var(--cyan)', IN_PROGRESS:'var(--orange)', RESOLVED:'var(--green)' };

  return (
    <div style={{ animation:'fadeUp 0.3s ease', maxWidth:1000, margin:'0 auto' }}>
      <PageHeader
        title={`Incident Report`}
        subtitle={`ID: ${incident.id}`}
        actions={
          <div style={{ display:'flex', gap:10 }}>
            {nextStatuses.length > 0 && (
              <Btn variant="cyan" onClick={() => { setNewStatus(nextStatuses[0]); setStatusModal(true); }}
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
              >
                Update Status
              </Btn>
            )}
            {isAdmin() && incident.status !== 'RESOLVED' && (
              <Btn variant="danger" size="sm" onClick={() => setDeleteModal(true)}>Delete</Btn>
            )}
            <Btn variant="secondary" onClick={() => navigate('/incidents')}>← Back</Btn>
          </div>
        }
      />

      {/* Status progress bar */}
      <Card style={{ marginBottom:20, padding:'20px 28px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:0 }}>
          {statusSteps.map((step, i) => {
            const done = i <= currentStep;
            const active = i === currentStep;
            const color = statusColors[step];
            return (
              <div key={step} style={{ display:'flex', alignItems:'center', flex: i < statusSteps.length-1 ? 1 : 'none' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0 }}>
                  <div style={{
                    width:32, height:32, borderRadius:'50%', border:`2px solid ${done ? color : 'var(--border-subtle)'}`,
                    background: done ? (active ? color : `${color}20`) : 'var(--bg-raised)',
                    display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.3s',
                    boxShadow: active ? `0 0 16px ${color}40` : 'none',
                  }}>
                    {i < currentStep
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : <div style={{ width:8, height:8, borderRadius:'50%', background: done ? color : 'var(--border-normal)' }} />
                    }
                  </div>
                  <span style={{ fontSize:10, fontWeight: active ? 700 : 400, color: done ? color : 'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>
                    {step.replace('_',' ')}
                  </span>
                </div>
                {i < statusSteps.length-1 && (
                  <div style={{ flex:1, height:2, background: i < currentStep ? color : 'var(--border-subtle)', margin:'0 8px', marginBottom:22, transition:'background 0.3s' }} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, alignItems:'start' }}>
        {/* Main details */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Header card */}
          <Card glowColor={typeInfo.color}>
            <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
              <div style={{
                width:52, height:52, borderRadius:'var(--r-md)',
                background:`${typeInfo.color}15`, border:`1px solid ${typeInfo.color}30`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0,
              }}>
                {typeInfo.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                  <TypeBadge type={incident.incidentType} />
                  <StatusBadge status={incident.status} />
                  <SeverityBadge severity={incident.severity} />
                </div>
                <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, marginBottom:4 }}>
                  {incident.incidentType === 'OTHER' ? incident.otherIncidentType : typeInfo.label}
                </h2>
                <p style={{ fontSize:12, color:'var(--text-muted)' }}>Reported {timeAgo(incident.createdAt)} · {fmtDateTime(incident.createdAt)}</p>
              </div>
            </div>
          </Card>

          {/* Info grid */}
          <Card>
            <SectionTitle>Incident Information</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
              {[
                { label:'Citizen Name', value: incident.citizenName },
                { label:'Reported By', value: incident.createdBy || '—' },
                { label:'Incident Type', value: typeInfo.label },
                { label:'Severity', value: incident.severity },
                { label:'Latitude', value: incident.latitude?.toFixed(6) },
                { label:'Longitude', value: incident.longitude?.toFixed(6) },
                { label:'Assigned Unit', value: incident.assignedUnit || 'Awaiting dispatch' },
                { label:'Hospital ID', value: incident.hospitalId || '—' },
              ].map((item, i) => (
                <div key={item.label} style={{
                  padding:'14px 16px',
                  borderBottom: i < 6 ? '1px solid var(--border-faint)' : 'none',
                  borderRight: i % 2 === 0 ? '1px solid var(--border-faint)' : 'none',
                }}>
                  <div style={{ fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>{item.label}</div>
                  <div style={{ fontSize:13, color:'var(--text-primary)', fontFamily: item.label.includes('titude') || item.label.includes('Unit') ? 'var(--font-mono)' : 'inherit', fontWeight: item.label === 'Assigned Unit' && incident.assignedUnit ? 600 : 400 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Notes */}
          {incident.notes && (
            <Card>
              <SectionTitle>Notes</SectionTitle>
              <p style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.7, padding:'12px 16px', background:'var(--bg-raised)', borderRadius:'var(--r-sm)', borderLeft:'3px solid var(--amber)' }}>
                {incident.notes}
              </p>
            </Card>
          )}

          {/* Map */}
          {incident.latitude && incident.longitude && (
            <Card>
              <SectionTitle>Location</SectionTitle>
              <div style={{ borderRadius:'var(--r-md)', overflow:'hidden', border:'1px solid var(--border-subtle)', height:220, background:'var(--bg-raised)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📍</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--amber)' }}>
                    {incident.latitude?.toFixed(5)}, {incident.longitude?.toFixed(5)}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                    <a href={`https://maps.google.com/?q=${incident.latitude},${incident.longitude}`} target="_blank" rel="noreferrer"
                      style={{ color:'var(--cyan)', textDecoration:'underline' }}>Open in Google Maps →</a>
                  </div>
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
              ? <Empty icon="📋" title="No timeline yet" />
              : (
                <div style={{ position:'relative' }}>
                  <div style={{ position:'absolute', left:15, top:8, bottom:8, width:1, background:'var(--border-subtle)' }} />
                  {timeline.map((event, i) => (
                    <div key={i} style={{ display:'flex', gap:14, marginBottom:18, position:'relative' }}>
                      <div style={{
                        width:30, height:30, borderRadius:'50%', background:'var(--bg-raised)',
                        border:'2px solid var(--amber)', display:'flex', alignItems:'center', justifyContent:'center',
                        flexShrink:0, zIndex:1,
                      }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--amber)' }} />
                      </div>
                      <div style={{ paddingTop:4 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', marginBottom:2 }}>
                          {event.fieldName || event.action || 'Status change'}
                        </div>
                        {event.oldValue && (
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                            <span style={{ textDecoration:'line-through' }}>{event.oldValue}</span>
                            {event.newValue && <span> → <span style={{ color:'var(--cyan)' }}>{event.newValue}</span></span>}
                          </div>
                        )}
                        <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:3, fontFamily:'var(--font-mono)' }}>
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
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <p style={{ fontSize:13, color:'var(--text-secondary)' }}>
            Current status: <StatusBadge status={incident.status} />
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {nextStatuses.map(s => {
              const info = INCIDENT_STATUSES.find(x => x.value === s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewStatus(s)}
                  style={{
                    padding:'12px 16px', borderRadius:'var(--r-sm)', border:`2px solid`,
                    borderColor: newStatus === s ? info.color : 'var(--border-subtle)',
                    background: newStatus === s ? `${info.color}15` : 'var(--bg-raised)',
                    color: newStatus === s ? info.color : 'var(--text-secondary)',
                    cursor:'pointer', textAlign:'left', fontSize:13, fontWeight:600, transition:'all var(--ease-fast)',
                  }}
                >
                  {s.replace('_',' ')}
                </button>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <Btn variant="secondary" onClick={() => setStatusModal(false)}>Cancel</Btn>
            <Btn onClick={handleStatusUpdate} loading={updating} disabled={!newStatus}>Confirm Update</Btn>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Incident">
        <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:20 }}>
          Are you sure you want to delete this incident? This action cannot be undone.
        </p>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn variant="secondary" onClick={() => setDeleteModal(false)}>Cancel</Btn>
          <Btn variant="danger" onClick={handleDelete} loading={deleting}>Delete Incident</Btn>
        </div>
      </Modal>
    </div>
  );
}
