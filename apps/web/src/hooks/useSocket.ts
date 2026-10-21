import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketEntry {
  socket: Socket;
  refCount: number;
  disconnectTimer?: ReturnType<typeof setTimeout> | undefined;
}

const socketPool = new Map<string, SocketEntry>();

export function useSocket(namespace = '/chat') {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token =
      localStorage.getItem('accessToken') || localStorage.getItem('token');

    // Do not connect if user is not authenticated
    if (!token) {
      socketRef.current = null;
      return;
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
      'http://localhost:3001';
    const fullUrl = `${baseUrl.replace(/\/$/, '')}${namespace}`;
    const poolKey = `${fullUrl}::${token}`;

    let entry = socketPool.get(poolKey);

    if (entry) {
      if (entry.disconnectTimer) {
        clearTimeout(entry.disconnectTimer);
        entry.disconnectTimer = undefined;
      }
      entry.refCount++;
    } else {
      const socket = io(fullUrl, {
        auth: { token },
        withCredentials: true,
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socket.on('connect_error', (err) => {
        console.warn(`[Socket] Connection notice on ${namespace}:`, err.message);
      });

      entry = { socket, refCount: 1 };
      socketPool.set(poolKey, entry);
    }

    socketRef.current = entry.socket;

    return () => {
      const currentEntry = socketPool.get(poolKey);
      if (currentEntry) {
        currentEntry.refCount--;
        if (currentEntry.refCount <= 0) {
          // Delay disconnect to absorb React 18 StrictMode mount/unmount churn and fast re-renders
          currentEntry.disconnectTimer = setTimeout(() => {
            if (currentEntry.refCount <= 0) {
              try {
                currentEntry.socket.disconnect();
              } catch {
                // Ignore disconnect error
              }
              socketPool.delete(poolKey);
            }
          }, 1000);
        }
      }
    };
  }, [namespace]);

  return socketRef;
}
