import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:3001'
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null

    const socket = io(url, { 
      auth: { token },
      withCredentials: true, 
      transports: ['polling', 'websocket'],
      autoConnect: Boolean(token),
    })

    socket.on('connect_error', (err) => {
      console.warn('Socket connection warning:', err.message)
    })

    socketRef.current = socket
    
    return () => {
      socket.disconnect()
    }
  }, [])

  return socketRef.current
}