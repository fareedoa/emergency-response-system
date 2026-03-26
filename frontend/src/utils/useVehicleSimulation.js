import { useState, useEffect, useRef } from 'react';

/**
 * Simulates real-time vehicle movement by nudging positions of active vehicles.
 * Active statuses: EN_ROUTE, DISPATCHED, RETURNING
 * Falls back to mock data if the API call fails or returns empty.
 */
const ACTIVE_STATUSES = new Set(['EN_ROUTE', 'DISPATCHED', 'RETURNING']);

function nudge(value, maxDelta = 0.0015) {
  return value + (Math.random() - 0.5) * 2 * maxDelta;
}

export function useVehicleSimulation(initialVehicles, fetchFn, intervalMs = 10000) {
  const [vehicles, setVehicles]           = useState(initialVehicles);
  const [isLive, setIsLive]               = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const vehiclesRef = useRef(vehicles);

  // Keep ref in sync
  useEffect(() => { vehiclesRef.current = vehicles; }, [vehicles]);

  // Fetch from API
  useEffect(() => {
    async function fetchVehicles() {
      try {
        const r = await fetchFn();
        if (r?.data?.length) {
          setVehicles(r.data);
          setIsLive(true);
        }
      } catch {
        setIsLive(false);
      } finally {
        setLastRefreshed(new Date());
      }
    }

    fetchVehicles();
    const fetch_id = setInterval(fetchVehicles, intervalMs);
    return () => clearInterval(fetch_id);
  }, [fetchFn, intervalMs]);

  // Movement simulation (every 3s, nudge active vehicles)
  useEffect(() => {
    const sim_id = setInterval(() => {
      setVehicles(prev =>
        prev.map(v => {
          if (!ACTIVE_STATUSES.has(v.status)) return v;
          return {
            ...v,
            currentLat: nudge(v.currentLat ?? 5.6037),
            currentLng: nudge(v.currentLng ?? -0.1870),
            updatedAt: new Date().toISOString(),
          };
        })
      );
    }, 3000);
    return () => clearInterval(sim_id);
  }, []);

  return { vehicles, setVehicles, isLive, lastRefreshed };
}
