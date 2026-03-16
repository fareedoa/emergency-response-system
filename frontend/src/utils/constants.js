// ── Incident Types (matches IncidentType.java) ───────────────────────────
export const INCIDENT_TYPES = [
  { value: 'MEDICAL_EMERGENCY', label: 'Medical Emergency', color: '#10B981', icon: '🚑', short: 'Medical' },
  { value: 'FIRE',              label: 'Fire',              color: '#F97316', icon: '🔥', short: 'Fire' },
  { value: 'CRIME',             label: 'Crime',             color: '#8B5CF6', icon: '🚨', short: 'Crime' },
  { value: 'ROBBERY',           label: 'Robbery',           color: '#EF4444', icon: '⚠️', short: 'Robbery' },
  { value: 'ACCIDENT',          label: 'Accident',          color: '#F59E0B', icon: '🚗', short: 'Accident' },
  { value: 'OTHER',             label: 'Other',             color: '#6B7280', icon: '📋', short: 'Other' },
];

// ── Severity Levels (matches Severity.java) ──────────────────────────────
export const SEVERITY_LEVELS = [
  { value: 'CRITICAL', label: 'Critical', color: '#EF4444' },
  { value: 'HIGH',     label: 'High',     color: '#F97316' },
  { value: 'MEDIUM',   label: 'Medium',   color: '#F59E0B' },
  { value: 'LOW',      label: 'Low',      color: '#10B981' },
];

// ── Incident Statuses (matches IncidentStatus.java) ──────────────────────
export const INCIDENT_STATUSES = [
  { value: 'CREATED',     label: 'Created',     color: '#F59E0B' },
  { value: 'DISPATCHED',  label: 'Dispatched',  color: '#22D3EE' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#F97316' },
  { value: 'RESOLVED',    label: 'Resolved',    color: '#10B981' },
];

// Next valid transitions
export const NEXT_STATUS = {
  CREATED:     ['DISPATCHED'],
  DISPATCHED:  ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED:    [],
};

// ── Vehicle Types (matches VehicleType.java) ─────────────────────────────
export const VEHICLE_TYPES = [
  { value: 'AMBULANCE',    label: 'Ambulance',    icon: '🚑' },
  { value: 'POLICE_CAR',   label: 'Police Car',   icon: '🚓' },
  { value: 'FIRE_TRUCK',   label: 'Fire Truck',   icon: '🚒' },
  { value: 'PATROL_BIKE',  label: 'Patrol Bike',  icon: '🏍️' },
];

// ── Vehicle Statuses (matches VehicleStatus.java) ────────────────────────
export const VEHICLE_STATUSES = [
  { value: 'IDLE',       label: 'Idle',       color: '#10B981' },
  { value: 'DISPATCHED', label: 'Dispatched', color: '#22D3EE' },
  { value: 'EN_ROUTE',   label: 'En Route',   color: '#F97316' },
  { value: 'ON_SCENE',   label: 'On Scene',   color: '#EF4444' },
  { value: 'RETURNING',  label: 'Returning',  color: '#F59E0B' },
];

// ── Station Types (matches StationType.java) ─────────────────────────────
export const STATION_TYPES = [
  { value: 'HOSPITAL',       label: 'Hospital' },
  { value: 'POLICE_STATION', label: 'Police Station' },
  { value: 'FIRE_STATION',   label: 'Fire Station' },
];

// ── User Roles (matches Role.java) ───────────────────────────────────────
export const USER_ROLES = [
  { value: 'SYSTEM_ADMIN',  label: 'System Administrator' },
  { value: 'HOSPITAL_ADMIN', label: 'Hospital Administrator' },
  { value: 'POLICE_ADMIN',  label: 'Police Administrator' },
  { value: 'FIRE_ADMIN',    label: 'Fire Administrator' },
];

// ── Helpers ───────────────────────────────────────────────────────────────
export const getTypeInfo     = (v) => INCIDENT_TYPES.find(x => x.value === v) || INCIDENT_TYPES[5];
export const getSeverityInfo = (v) => SEVERITY_LEVELS.find(x => x.value === v) || { color: '#6B7280', label: v };
export const getStatusInfo   = (v) => INCIDENT_STATUSES.find(x => x.value === v) || { color: '#6B7280', label: v };
export const getVehicleStatusInfo = (v) => VEHICLE_STATUSES.find(x => x.value === v) || { color: '#6B7280', label: v };
export const getRoleLabel    = (v) => USER_ROLES.find(x => x.value === v)?.label || v;

export const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
};
export const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
};
export const timeAgo = (d) => {
  if (!d) return '—';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};
