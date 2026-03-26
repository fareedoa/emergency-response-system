import {
  HeartPulse, Flame, ShieldAlert, AlertTriangle,
  Car, FileQuestion, Ambulance, Shield, Bike, Truck
} from 'lucide-react';

// ── Incident Types (matches IncidentType.java) ───────────────────────────
export const INCIDENT_TYPES = [
  { value: 'MEDICAL_EMERGENCY', label: 'Medical Emergency', color: 'var(--color-success)',  Icon: HeartPulse, short: 'Medical' },
  { value: 'FIRE',              label: 'Fire',              color: 'var(--color-warning)',  Icon: Flame,      short: 'Fire' },
  { value: 'CRIME',             label: 'Crime',             color: 'var(--color-violet)',   Icon: ShieldAlert,short: 'Crime' },
  { value: 'ROBBERY',           label: 'Robbery',           color: 'var(--color-danger)',   Icon: AlertTriangle, short: 'Robbery' },
  { value: 'ACCIDENT',          label: 'Accident',          color: 'var(--color-brand)',    Icon: Car,        short: 'Accident' },
  { value: 'OTHER',             label: 'Other',             color: 'var(--text-muted)',     Icon: FileQuestion, short: 'Other' },
];

// ── Severity Levels (matches Severity.java) ──────────────────────────────
export const SEVERITY_LEVELS = [
  { value: 'CRITICAL', label: 'Critical', color: 'var(--color-danger)' },
  { value: 'HIGH',     label: 'High',     color: 'var(--color-warning)' },
  { value: 'MEDIUM',   label: 'Medium',   color: 'var(--color-brand)' },
  { value: 'LOW',      label: 'Low',      color: 'var(--color-success)' },
];

// ── Incident Statuses (matches IncidentStatus.java) ──────────────────────
export const INCIDENT_STATUSES = [
  { value: 'CREATED',     label: 'Created',     color: 'var(--color-brand)' },
  { value: 'DISPATCHED',  label: 'Dispatched',  color: 'var(--color-dispatch)' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'var(--color-warning)' },
  { value: 'RESOLVED',    label: 'Resolved',    color: 'var(--color-success)' },
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
  { value: 'AMBULANCE',   label: 'Ambulance',   Icon: Ambulance },
  { value: 'POLICE_CAR',  label: 'Police Car',  Icon: Shield },
  { value: 'FIRE_TRUCK',  label: 'Fire Truck',  Icon: Flame },
  { value: 'PATROL_BIKE', label: 'Patrol Bike', Icon: Bike },
];

// ── Vehicle Statuses (matches VehicleStatus.java) ────────────────────────
export const VEHICLE_STATUSES = [
  { value: 'IDLE',       label: 'Idle',       color: 'var(--color-success)' },
  { value: 'DISPATCHED', label: 'Dispatched', color: 'var(--color-dispatch)' },
  { value: 'EN_ROUTE',   label: 'En Route',   color: 'var(--color-warning)' },
  { value: 'ON_SCENE',   label: 'On Scene',   color: 'var(--color-danger)' },
  { value: 'RETURNING',  label: 'Returning',  color: 'var(--color-brand)' },
];

// ── Station Types ─────────────────────────────────────────────────────────
export const STATION_TYPES = [
  { value: 'HOSPITAL',       label: 'Hospital' },
  { value: 'POLICE_STATION', label: 'Police Station' },
  { value: 'FIRE_STATION',   label: 'Fire Station' },
];

// ── User Roles (matches Role.java) ───────────────────────────────────────
export const USER_ROLES = [
  { value: 'SYSTEM_ADMIN',   label: 'System Administrator' },
  { value: 'HOSPITAL_ADMIN', label: 'Hospital Administrator' },
  { value: 'POLICE_ADMIN',   label: 'Police Administrator' },
  { value: 'FIRE_ADMIN',     label: 'Fire Administrator' },
];

// ── Role → station-type filter (null = see all) ───────────────────────────
// Used on Tracking, Vehicles and Dashboard to restrict views by role.
export const ROLE_STATION = {
  SYSTEM_ADMIN:   null,           // sees every station
  HOSPITAL_ADMIN: 'HOSPITAL',
  POLICE_ADMIN:   'POLICE_STATION',
  FIRE_ADMIN:     'FIRE_STATION',
};

// Human-readable label for the station a role manages
export const ROLE_STATION_LABEL = {
  SYSTEM_ADMIN:   'All Stations',
  HOSPITAL_ADMIN: 'Hospital',
  POLICE_ADMIN:   'Police',
  FIRE_ADMIN:     'Fire',
};

// ── Role colours ──────────────────────────────────────────────────────────
export const ROLE_COLORS = {
  SYSTEM_ADMIN:   'var(--color-brand)',
  HOSPITAL_ADMIN: 'var(--color-success)',
  POLICE_ADMIN:   'var(--color-dispatch)',
  FIRE_ADMIN:     'var(--color-warning)',
};

// ── Helpers ───────────────────────────────────────────────────────────────
export const getTypeInfo       = (v) => INCIDENT_TYPES.find(x => x.value === v) || INCIDENT_TYPES[5];
export const getSeverityInfo   = (v) => SEVERITY_LEVELS.find(x => x.value === v) || { color: 'var(--text-muted)', label: v };
export const getStatusInfo     = (v) => INCIDENT_STATUSES.find(x => x.value === v) || { color: 'var(--text-muted)', label: v };
export const getVehicleStatusInfo = (v) => VEHICLE_STATUSES.find(x => x.value === v) || { color: 'var(--text-muted)', label: v };
export const getRoleLabel      = (v) => USER_ROLES.find(x => x.value === v)?.label || v;
export const getVehicleTypeInfo = (v) => VEHICLE_TYPES.find(x => x.value === v);

// ── Vehicle status colours ────────────────────────────────────────────────
export const VEHICLE_STATUS_COLORS = {
  IDLE:       'var(--color-success)',
  DISPATCHED: 'var(--color-dispatch)',
  EN_ROUTE:   'var(--color-warning)',
  ON_SCENE:   'var(--color-danger)',
  RETURNING:  'var(--color-brand)',
};

// ── Vehicle icon components (Lucide) ─────────────────────────────────────
export const VEHICLE_ICON_MAP = {
  AMBULANCE:   Ambulance,
  POLICE_CAR:  Shield,
  FIRE_TRUCK:  Flame,
  PATROL_BIKE: Bike,
};

// ── Formatters ────────────────────────────────────────────────────────────
export const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
export const timeAgo = (d) => {
  if (!d) return '—';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};
