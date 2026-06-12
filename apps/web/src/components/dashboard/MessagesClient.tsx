"use client"
import React, { useEffect, useState } from 'react'
import { useSocket } from '../../hooks/useSocket'

export default function MessagesClient({ initialConversations }: { initialConversations: any[] }) {
  const socketRef = useSocket()
  const [conversations, setConversations] = useState(initialConversations || [])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    socket.on('chat:new_message', (msg: any) => {
      // naive: refetch or insert
      setConversations((c) => [msg.conversation, ...c.filter((x) => x.id !== msg.conversation.id)])
    })

    return () => {
      socket.off('chat:new_message')
    }
  }, [socketRef])

  return (
    <div className="space-y-4">
      {conversations.length === 0 && <div className="text-gray-600">No conversations</div>}
      {conversations.map((conv) => (
        <div key={conv.id} className="border rounded p-3 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{conv.title || 'Conversation'}</div>
              <div className="text-sm text-gray-600">{conv.lastMessage?.text}</div>
            </div>
            <div className="text-sm text-gray-500">{new Date(conv.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
