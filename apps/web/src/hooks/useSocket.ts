import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocket(path?: string) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:3002'
    socketRef.current = io(url, { withCredentials: true, transports: ['websocket', 'polling'] })
    return () => {
      socketRef.current?.disconnect()
    }
  }, [path])

  return socketRef
}
