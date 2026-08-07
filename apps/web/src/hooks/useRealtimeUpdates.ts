/**
 * Real-time updates hook using Socket.IO with polling fallback.
 * Connects to NEXT_PUBLIC_SOCKET_URL if available, otherwise uses polling.
 */

'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

export type SocketStatus = 'connected' | 'reconnecting' | 'disconnected';

interface UseRealtimeUpdatesOptions {
  sellerId: string;
  enabled?: boolean;
}

interface RealtimeState {
  status: SocketStatus;
  lastConnected: Date | null;
}

export function useRealtimeUpdates({ sellerId, enabled = true }: UseRealtimeUpdatesOptions): RealtimeState {
  const qc = useQueryClient();
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const [lastConnected, setLastConnected] = useState<Date | null>(null);
  const socketRef = useRef<unknown>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const invalidateDashboard = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['dashboard-kpis', sellerId] });
    void qc.invalidateQueries({ queryKey: ['pending-actions', sellerId] });
    void qc.invalidateQueries({ queryKey: ['recent-orders', sellerId] });
    void qc.invalidateQueries({ queryKey: ['notifications', sellerId] });
  }, [qc, sellerId]);

  useEffect(() => {
    if (!enabled || !sellerId) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

    if (!socketUrl) {
      // Polling fallback: refresh every 60 seconds
      setStatus('connected');
      setLastConnected(new Date());
      const interval = setInterval(() => {
        invalidateDashboard();
      }, 60000);
      return () => clearInterval(interval);
    }

    // Socket.IO connection
    let mounted = true;

    const connect = async () => {
      try {
        // Dynamic import to keep Socket.IO out of the initial bundle
        const { io } = await import('socket.io-client');
        if (!mounted) return;

        const socket = io(socketUrl, {
          auth: { sellerId },
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 30000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          setStatus('connected');
          setLastConnected(new Date());
        });

        socket.on('disconnect', () => {
          setStatus('reconnecting');
        });

        socket.on('reconnect', () => {
          setStatus('connected');
          setLastConnected(new Date());
          invalidateDashboard();
        });

        socket.on('reconnect_failed', () => {
          setStatus('disconnected');
        });

        // Business events
        socket.on('new_order', () => {
          void qc.invalidateQueries({ queryKey: ['recent-orders', sellerId] });
          void qc.invalidateQueries({ queryKey: ['dashboard-kpis', sellerId] });
          void qc.invalidateQueries({ queryKey: ['pending-actions', sellerId] });
          void qc.invalidateQueries({ queryKey: ['notifications', sellerId] });
        });

        socket.on('new_message', () => {
          void qc.invalidateQueries({ queryKey: ['messages-preview', sellerId] });
          void qc.invalidateQueries({ queryKey: ['dashboard-kpis', sellerId] });
          void qc.invalidateQueries({ queryKey: ['notifications', sellerId] });
        });

        socket.on('listing_status_change', () => {
          void qc.invalidateQueries({ queryKey: ['dashboard-kpis', sellerId] });
          void qc.invalidateQueries({ queryKey: ['inventory-alerts', sellerId] });
          void qc.invalidateQueries({ queryKey: ['notifications', sellerId] });
          void qc.invalidateQueries({ queryKey: ['seller-listings', sellerId] });
        });

        socket.on('listing:moderated', (data: { listingId: string; status: string; reason?: string }) => {
          void qc.invalidateQueries({ queryKey: ['dashboard-kpis', sellerId] });
          void qc.invalidateQueries({ queryKey: ['notifications', sellerId] });
          void qc.invalidateQueries({ queryKey: ['seller-listings', sellerId] });
          // Trigger toast notification for the seller
          if (typeof window !== 'undefined' && (window as any).__listingModerationCallback) {
            (window as any).__listingModerationCallback(data);
          }
        });

        socket.on('notification', () => {
          void qc.invalidateQueries({ queryKey: ['notifications', sellerId] });
        });
      } catch (err) {
        console.warn('[RealtimeUpdates] Socket.IO failed to load:', err);
        setStatus('disconnected');
      }
    };

    void connect();

    return () => {
      mounted = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      // Disconnect socket on unmount
      if (socketRef.current) {
        const s = socketRef.current as { disconnect?: () => void };
        if (typeof s.disconnect === 'function') s.disconnect();
        socketRef.current = null;
      }
    };
  }, [enabled, sellerId, qc, invalidateDashboard]);

  return { status, lastConnected };
}

// ─── Offline detection hook ────────────────────────────────────────────────────

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? window.navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
