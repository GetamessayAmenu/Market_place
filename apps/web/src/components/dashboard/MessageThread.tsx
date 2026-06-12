"use client"
import React, { useEffect, useState, useRef } from 'react'
import { useSocket } from '../../hooks/useSocket'
import { apiPost } from '../../lib/api'

export default function MessageThread({ conversation, initialMessages }: any) {
  const socketRef = useSocket()
  const [messages, setMessages] = useState(initialMessages || [])
  const [text, setText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    socket.emit('chat:join', { conversationId: conversation.id })

    const onNew = (msg: any) => {
      if (msg.conversation?.id === conversation.id) {
        setMessages((m: any) => [...m, msg])
      }
    }

    socket.on('chat:new_message', onNew)

    return () => {
      socket.off('chat:new_message', onNew)
      socket.emit('chat:leave', { conversationId: conversation.id })
    }
  }, [conversation.id, socketRef])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    if (!text.trim()) return
    const socket = socketRef.current
    const payload = { conversationId: conversation.id, text }
    try {
      // optimistic append
      const temp = { id: `temp-${Date.now()}`, text, createdAt: new Date().toISOString(), sender: 'me' }
      setMessages((m: any) => [...m, temp])
      setText('')
      if (socket) {
        socket.emit('chat:send', payload)
      } else {
        // fallback to HTTP
        await apiPost(`/conversations/${conversation.id}/messages`, { text })
      }
    } catch (err) {
      console.error('send message failed', err)
    }
  }

  return (
    <div className="border rounded bg-white">
      <div className="p-4 h-96 overflow-y-auto space-y-3">
        {messages.map((m: any) => (
          <div key={m.id} className={`p-2 rounded ${m.sender === 'me' ? 'bg-blue-50 self-end' : 'bg-gray-50'}`}>
            <div className="text-sm">{m.text}</div>
            <div className="text-xs text-gray-500 mt-1">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 px-3 py-2 border rounded" placeholder="Type a message" />
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
      </form>
    </div>
  )
}
