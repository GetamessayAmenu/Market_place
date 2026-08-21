"use client"
import React, { useEffect, useState } from 'react'
import { useSocket } from '../../hooks/useSocket'

export default function NotificationsClient({ initialNotifications }: { initialNotifications: any[] }) {
  const socketRef = useSocket()
  const [notifications, setNotifications] = useState(Array.isArray(initialNotifications) ? initialNotifications : [])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    socket.on('notifications:new', (n: any) => {
      setNotifications((s) => [n, ...s])
    })
    socket.on('notifications:read', ({ notificationId }: any) => {
      setNotifications((s) => s.filter((x) => x.id !== notificationId))
    })

    return () => {
      socket.off('notifications:new')
      socket.off('notifications:read')
    }
  }, [socketRef])

  return (
    <div className="space-y-3">
      {notifications.length === 0 && <div className="text-gray-600">No notifications</div>}
      {notifications.map((n) => (
        <div key={n.id} className="border rounded p-3 bg-white">
          <div className="font-medium">{n.title}</div>
          <div className="text-sm text-gray-600">{n.body}</div>
        </div>
      ))}
    </div>
  )
}
