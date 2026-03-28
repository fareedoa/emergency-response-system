import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Btn, DataTable, StatusBadge, SeverityBadge, TypeBadge, Card, Spinner } from '../components/UI';
import { INCIDENT_TYPES, SEVERITY_LEVELS, INCIDENT_STATUSES, ROLE_INCIDENT_TYPES, fmtDateTime, timeAgo } from '../utils/constants';
import { Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { label: 'All',          value: '' },
  { label: 'Created',      value: 'CREATED' },
  { label: 'Dispatched',   value: 'DISPATCHED' },
  { label: 'In Progress',  value: 'IN_PROGRESS' },
  { label: 'Resolved',     value: 'RESOLVED' },
];

const STATUS_COLORS = {
  CREATED: 'var(--color-brand)', DISPATCHED: 'var(--color-dispatch)',
  IN_PROGRESS: 'var(--color-warning)', RESOLVED: 'var(--color-success)',
};

const inputSel = {
  background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--r-sm)', padding: '8px 32px 8px 12px', color: 'var(--text-secondary)',
  fontSize: 12, outline: 'none', cursor: 'pointer', appearance: 'none', minWidth: 140,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%237A93BF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
};

export default function Incidents() {
  const navigate = useNavigate();
  const { user, is } = useAuth();
  const allowedTypes = ROLE_INCIDENT_TYPES[user?.role] ?? null;
  const visibleTypes = allowedTypes ? INCIDENT_TYPES.filter(t => allowedTypes.includes(t.value)) : INCIDENT_TYPES;
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [filter, setFilter] = useState({ type: '', severity: '' });
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    incidentApi.list()
      .then(r => setIncidents(r.data || []))
      .catch(() => toast.error('Failed to load incidents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this incident? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await incidentApi.delete(id);
      toast.success('Incident deleted');
      setIncidents(prev => prev.filter(i => i.id !== id));
    } catch {
      toast.error('Failed to delete incident');
    } finally { setDeleting(null); }
  };

  const filtered = incidents.filter(i => {
    if (activeTab && i.status !== activeTab) return false;
    if (filter.type && i.incidentType !== filter.type) return false;
    if (filter.severity && i.severity !== filter.severity) return false;
    if (search) {
      const q = search.toLowerCase();
      return i.citizenName?.toLowerCase().includes(q) || i.incidentType?.toLowerCase().includes(q);
    }
    return true;
  });

  const tabCount = (val) => val ? incidents.filter(i => i.status === val).length : incidents.length;

  const cols = [
    {
      key: 'severity', label: 'Sev', w: 70, sortable: false,
      render: (v) => <SeverityBadge severity={v} />,
    },
    {
      key: 'citizenName', label: 'Citizen', w: 160,
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{timeAgo(row.createdAt)}</div>
        </div>
      ),
    },
    { key: 'incidentType', label: 'Type', render: (v) => <TypeBadge type={v} /> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'createdAt', label: 'Reported', w: 160,
      render: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{fmtDateTime(v)}</span>,
    },
    {
      key: 'assignedUnit', label: 'Unit', w: 110, sortable: false,
      render: (v) => v
        ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-dispatch)' }}>{String(v).slice(0, 8)}…</span>
        : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>,
    },
    ...(is('SYSTEM_ADMIN') ? [{
      key: 'id', label: '', w: 44, sortable: false,
      render: (v) => (
        <button onClick={e => { e.stopPropagation(); handleDelete(v); }} disabled={deleting === v}
          style={{ color: 'var(--color-danger)', opacity: deleting === v ? 0.4 : 1, display: 'flex', padding: 4 }}
          title="Delete incident">
          <Trash2 size={13} strokeWidth={2} />
        </button>
      ),
    }] : []),
  ];

  if (loading) return <Spinner />;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <PageHeader
        title="Incidents"
        subtitle={`${incidents.length} total · ${incidents.filter(i => i.status !== 'RESOLVED').length} open`}
        actions={
          is('SYSTEM_ADMIN','HOSPITAL_ADMIN','POLICE_ADMIN','FIRE_ADMIN') &&
          <Btn icon={<Plus size={14} />} onClick={() => navigate('/incidents/new')}>Log Incident</Btn>
        }
      />

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0, overflowX: 'auto' }}>
        {STATUS_TABS.map(tab => {
          const isActive = activeTab === tab.value;
          const color = STATUS_COLORS[tab.value] || 'var(--color-brand)';
          return (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', fontSize: 12, fontWeight: isActive ? 700 : 500, cursor: 'pointer', borderRadius: 'var(--r-sm) var(--r-sm) 0 0', borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent', color: isActive ? color : 'var(--text-muted)', background: isActive ? `color-mix(in srgb, ${color} 8%, transparent)` : 'transparent', whiteSpace: 'nowrap' }}>
              {tab.label}
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: isActive ? `color-mix(in srgb, ${color} 18%, transparent)` : 'var(--bg-raised)', color: isActive ? color : 'var(--text-muted)', padding: '1px 6px', borderRadius: 'var(--r-full)' }}>
                {tabCount(tab.value)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search citizen or type…"
            style={{ width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)', padding: '8px 12px 8px 32px', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--color-brand)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
          />
        </div>
        <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))} style={inputSel}>
          <option value="">All Types</option>
          {visibleTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filter.severity} onChange={e => setFilter(f => ({ ...f, severity: e.target.value }))} style={inputSel}>
          <option value="">All Severities</option>
          {SEVERITY_LEVELS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <Card style={{ padding: 0 }}>
        <DataTable
          cols={cols}
          rows={filtered}
          onRowClick={row => navigate(`/incidents/${row.id}`)}
          emptyTitle="No incidents"
          emptyMsg="Try adjusting your search or filters."
        />
      </Card>
    </div>
  );
}
