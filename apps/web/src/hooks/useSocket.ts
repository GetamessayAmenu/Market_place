import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(namespace = '/chat') {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
    const fullUrl = `${baseUrl.replace(/\/$/, '')}${namespace}`;

    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('token') || localStorage.getItem('accessToken'))
      : null;

    const socket = io(fullUrl, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: Boolean(token),
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect_error', (err) => {
      // Avoid uncaught unhandled errors in console when server is disconnected or starting up
      console.warn(`[Socket] Connection notice on ${namespace}:`, err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [namespace]);

  return socketRef;
}
