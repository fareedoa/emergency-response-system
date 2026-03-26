import { useState, useEffect, useRef } from 'react';
import { URLS } from '../api';
import { useAuth } from '../context/AuthContext';

/**
 * useTrackingSocket — subscribes to the tracking-service WebSocket
 * Emits location update events from the backend STOMP broker at /topic/location-updates
 *
 * Backend sends: VehicleLocationResponse { vehicleId, latitude, longitude, updatedAt, vehicleType, status }
 *
 * @param {Function} onUpdate  - called with each VehicleLocationResponse
 */
export function useTrackingSocket(onUpdate) {
  const { user } = useAuth();
  const wsRef    = useRef(null);
  const stopRef  = useRef(false);
  const retryRef = useRef(0);

  useEffect(() => {
    if (!user) return;
    stopRef.current = false;

    function connect() {
      if (stopRef.current) return;
      const token = localStorage.getItem('swiftaid_access');
      // Try STOMP-over-WebSocket. Falls back gracefully if not available.
      const url = URLS.WS.replace(/^http/, 'ws') + '/ws/websocket';
      try {
        const ws = new WebSocket(url + (token ? `?token=${token}` : ''));
        wsRef.current = ws;

        ws.onopen = () => { retryRef.current = 0; };

        // STOMP frame parser (minimal, handles MESSAGE frames)
        ws.onmessage = (event) => {
          try {
            const raw = event.data;
            if (typeof raw !== 'string') return;
            // STOMP MESSAGE frame starts with "MESSAGE"
            if (raw.startsWith('MESSAGE')) {
              const bodyStart = raw.indexOf('\n\n') + 2;
              const body = raw.slice(bodyStart).replace(/\0$/, '');
              const data = JSON.parse(body);
              onUpdate?.(data);
            }
          } catch {}
        };

        ws.onclose = () => {
          if (stopRef.current) return;
          const delay = Math.min(1000 * 2 ** retryRef.current, 30000);
          retryRef.current++;
          setTimeout(connect, delay);
        };

        ws.onerror = () => ws.close();

        // Send STOMP CONNECT + SUBSCRIBE after connection
        ws.addEventListener('open', () => {
          ws.send(`CONNECT\naccept-version:1.2\nheart-beat:0,0\n\n\0`);
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(`SUBSCRIBE\nid:sub-0\ndestination:/topic/location-updates\n\n\0`);
            }
          }, 100);
        });
      } catch {}
    }

    connect();
    return () => {
      stopRef.current = true;
      wsRef.current?.close();
    };
  }, [user]);
}
