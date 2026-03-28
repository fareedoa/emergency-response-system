import { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { URLS } from '../api';
import { useAuth } from '../context/AuthContext';

export function useTrackingSocket(onUpdate) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('swiftaid_access');
    const url = `${URLS.WS}/ws-tracking/websocket?token=${token}`;

    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      reconnectDelay: 5000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000,
      onConnect: () => {
        setConnected(true);
        client.subscribe('/topic/location-updates', (msg) => {
          try {
            const data = JSON.parse(msg.body);
            onUpdate?.({
              ...data,
              vehicleId: data.vehicleId ? String(data.vehicleId) : data.vehicleId,
              status:    data.vehicleStatus || data.status,
              updatedAt: data.recordedAt    || data.updatedAt,
            });
          } catch {}
        });
      },
      onStompError: (err) => console.error('STOMP error', err),
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      setConnected(false);
    };
  }, [user]);

  return { connected };
}