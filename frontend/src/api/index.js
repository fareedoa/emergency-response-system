import axios from 'axios';

// ── Service URLs (match application.yaml ports) ──────────────────────────
export const URLS = {
  AUTH:      import.meta.env.VITE_AUTH_URL      || 'http://localhost:8081',
  INCIDENT:  import.meta.env.VITE_INCIDENT_URL  || 'http://localhost:8082',
  TRACKING:  import.meta.env.VITE_TRACKING_URL  || 'http://localhost:8083',
  ANALYTICS: import.meta.env.VITE_ANALYTICS_URL || 'http://localhost:8084',
  WS:        import.meta.env.VITE_WS_URL         || 'http://localhost:8083',
};

// ── Token helpers ─────────────────────────────────────────────────────────
const getToken   = () => localStorage.getItem('swiftaid_access');
const getRefresh = () => localStorage.getItem('swiftaid_refresh');
const setToken   = (t) => localStorage.setItem('swiftaid_access', t);
export const clearAuth = () => { localStorage.removeItem('swiftaid_access'); localStorage.removeItem('swiftaid_refresh'); localStorage.removeItem('swiftaid_user'); };

// ── Axios factory ─────────────────────────────────────────────────────────
function makeClient(baseURL) {
  const c = axios.create({ baseURL, timeout: 15000, headers: { 'Content-Type': 'application/json' } });

  c.interceptors.request.use(cfg => {
    const tok = getToken();
    if (tok) cfg.headers.Authorization = `Bearer ${tok}`;
    return cfg;
  });

  c.interceptors.response.use(
    res => res,
    async err => {
      const orig = err.config;
      if (err.response?.status === 401 && !orig._retry) {
        orig._retry = true;
        try {
          const { data } = await axios.post(`${URLS.AUTH}/auth/refresh-token`, { refreshToken: getRefresh() });
          setToken(data.accessToken);
          orig.headers.Authorization = `Bearer ${data.accessToken}`;
          return c(orig);
        } catch {
          clearAuth();
          window.location.href = '/login';
        }
      }
      return Promise.reject(err);
    }
  );
  return c;
}

export const authHttp     = makeClient(URLS.AUTH);
export const incidentHttp = makeClient(URLS.INCIDENT);
export const trackingHttp = makeClient(URLS.TRACKING);
export const analyticsHttp = makeClient(URLS.ANALYTICS);

// ── Auth Service (port 8081) ──────────────────────────────────────────────
export const authApi = {
  login:          (email, password)  => authHttp.post('/auth/login', { email, password }),
  register:       (body)             => authHttp.post('/auth/register', body),
  logout:         ()                 => authHttp.post('/auth/logout'),
  refresh:        (refreshToken)     => authHttp.post('/auth/refresh-token', { refreshToken }),
  profile:        ()                 => authHttp.get('/auth/profile'),
  updateProfile:  (body)             => authHttp.put('/auth/profile', body),
  listUsers:      (params)           => authHttp.get('/auth/users', { params }),
  deactivateUser: (id)               => authHttp.put(`/auth/users/${id}/deactivate`),
};

// ── Incident Service (port 8082) ──────────────────────────────────────────
export const incidentApi = {
  create:         (body)   => incidentHttp.post('/incidents', body),
  list:           ()       => incidentHttp.get('/incidents'),
  listOpen:       ()       => incidentHttp.get('/incidents/open'),
  get:            (id)     => incidentHttp.get(`/incidents/${id}`),
  updateStatus:   (id, status) => incidentHttp.put(`/incidents/${id}/status`, { status }),
  assign:         (id, responderId) => incidentHttp.put(`/incidents/${id}/assign`, { responderId }),
  delete:         (id)     => incidentHttp.delete(`/incidents/${id}`),
  timeline:       (id)     => incidentHttp.get(`/incidents/${id}/timeline`),
  notes:          (id)     => incidentHttp.get(`/incidents/${id}/notes`),
  nearestResponder: (id)   => incidentHttp.get(`/incidents/${id}/responders/nearest`),
};

// ── Tracking Service (port 8083) ──────────────────────────────────────────
export const trackingApi = {
  registerVehicle:   (body)   => trackingHttp.post('/vehicles/register', body),
  listVehicles:      ()       => trackingHttp.get('/vehicles'),
  getVehicle:        (id)     => trackingHttp.get(`/vehicles/${id}`),
  getLocation:       (id)     => trackingHttp.get(`/vehicles/${id}/location`),
  updateLocation:    (id, lat, lng) => trackingHttp.put(`/vehicles/${id}/location`, { latitude: lat, longitude: lng }),
  getHistory:        (id, params)   => trackingHttp.get(`/vehicles/${id}/history`, { params }),
  updateStatus:      (id, status)   => trackingHttp.put(`/vehicles/${id}/status`, { status }),
  activeVehicles:    ()       => trackingHttp.get('/tracking/active'),
  incidentVehicles:  (incidentId)   => trackingHttp.get(`/tracking/incident/${incidentId}`),
};

// ── Analytics Service (port 8084) ─────────────────────────────────────────
export const analyticsApi = {
  responseTimes:      (p) => analyticsHttp.get('/analytics/response-times', { params: p }).catch(() => ({ data: null })),
  incidentsByRegion:  (p) => analyticsHttp.get('/analytics/incidents-by-region', { params: p }).catch(() => ({ data: [] })),
  resourceUtil:       (p) => analyticsHttp.get('/analytics/resource-utilization', { params: p }).catch(() => ({ data: [] })),
  hospitalCapacity:   () => analyticsHttp.get('/analytics/hospital-capacity').catch(() => ({ data: [] })),
  incidentTrends:     (p) => analyticsHttp.get('/analytics/incident-trends', { params: p }).catch(() => ({ data: [] })),
  peakHours:          () => analyticsHttp.get('/analytics/peak-hours').catch(() => ({ data: [] })),
  topResponders:      () => analyticsHttp.get('/analytics/top-responders').catch(() => ({ data: [] })),
  summary:            () => analyticsHttp.get('/analytics/summary-dashboard').catch(() => ({ data: null })),
};
