"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Avatar, Button, cn } from '@marketplace/ui';
import { useSocket } from '../../hooks/useSocket';
import type { ChatConversation, ChatMessage } from '../../lib/chatApi';
import {
  fetchConversationMessages,
  formatDateSeparator,
  getOtherUser,
  isDifferentDay,
  markConversationRead,
  sendMessage as apiSendMessage,
  editMessage as apiEditMessage,
  deleteMessage as apiDeleteMessage,
} from '../../lib/chatApi';
import ContextCard from './ContextCard';
import MessageComposer from './MessageComposer';
import RichMessageRenderer from './RichMessageRenderer';
import BlockReportModal from './BlockReportModal';

interface MessageThreadProps {
  conversation: ChatConversation;
  currentUserId: string;
  initialMessages?: ChatMessage[];
}

export default function MessageThread({
  conversation,
  currentUserId,
  initialMessages = [],
}: MessageThreadProps) {
  const socketRef = useSocket('/chat');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [connected, setConnected] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [typingName, setTypingName] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editContent, setEditContent] = useState('');

  // Modal State
  const [modalMode, setModalMode] = useState<'block' | 'report' | null>(null);
  const [reportTargetMessageId, setReportTargetMessageId] = useState<string | undefined>(undefined);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const otherUser = useMemo(() => getOtherUser(conversation, currentUserId), [conversation?.id, currentUserId]);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Fetch messages if initial empty
  useEffect(() => {
    let isMounted = true;
    if (!conversation?.id) return;

    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
      scrollToBottom(false);
    } else {
      fetchConversationMessages(conversation.id)
        .then((res) => {
          if (isMounted) {
            setMessages(res.data || []);
            scrollToBottom(false);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [conversation?.id]);

  // Socket setup & room join
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversation?.id) return;

    const onConnect = () => {
      setConnected(true);
      socket.emit('chat:join', { conversationId: conversation.id });
    };

    const onDisconnect = () => setConnected(false);

    if (socket.connected) {
      setConnected(true);
      socket.emit('chat:join', { conversationId: conversation.id });
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    const onNewMessage = (msg: ChatMessage) => {
      if (msg.conversationId !== conversation.id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.senderId !== currentUserId) {
        socket.emit('chat:read', { conversationId: conversation.id });
      }
      scrollToBottom();
    };

    const onTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId !== conversation.id || data.userId === currentUserId) return;
      setTypingName(data.isTyping ? (otherUser?.displayName || 'User') : null);
    };

    const onRead = (data: { conversationId: string; readBy: string }) => {
      if (data.conversationId !== conversation.id || data.readBy === currentUserId) return;
      setMessages((prev) =>
        prev.map((m) => (m.senderId === currentUserId ? { ...m, readAt: new Date().toISOString(), deliveryStatus: 'READ' } : m))
      );
    };

    const onPresence = (data: { userId: string; isOnline: boolean }) => {
      if (data.userId === otherUser?.id) {
        setIsOtherOnline(data.isOnline);
      }
    };

    const onEdited = (msg: ChatMessage) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, body: msg.body, editedAt: msg.editedAt ?? null } : m)));
    };

    const onDeleted = (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    };

    socket.on('chat:new_message', onNewMessage);
    socket.on('new_message', onNewMessage);
    socket.on('chat:user_typing', onTyping);
    socket.on('user_typing', onTyping);
    socket.on('chat:message_read', onRead);
    socket.on('chat:presence_update', onPresence);
    socket.on('chat:message_edited', onEdited);
    socket.on('chat:message_deleted', onDeleted);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat:new_message', onNewMessage);
      socket.off('new_message', onNewMessage);
      socket.off('chat:user_typing', onTyping);
      socket.off('user_typing', onTyping);
      socket.off('chat:message_read', onRead);
      socket.off('chat:presence_update', onPresence);
      socket.off('chat:message_edited', onEdited);
      socket.off('chat:message_deleted', onDeleted);
    };
  }, [conversation?.id, currentUserId, otherUser?.id, otherUser?.displayName, scrollToBottom]);

  // Mark as read on mount
  useEffect(() => {
    if (conversation?.id) {
      markConversationRead(conversation.id).catch(() => {});
    }
  }, [conversation?.id]);

  const handleSendMessage = async (payload: { content: string; messageType?: string; attachments?: any[] }) => {
    const socket = socketRef.current;
    const tempId = `temp-${Date.now()}`;

    const sendApiPayload: { content: string; body?: string; messageType?: string; attachments?: any; replyToId?: string } = {
      content: payload.content,
    };
    if (payload.messageType) sendApiPayload.messageType = payload.messageType;
    if (payload.attachments) sendApiPayload.attachments = payload.attachments;
    if (replyingTo?.id) sendApiPayload.replyToId = replyingTo.id;

    const optimistic: ChatMessage = {
      id: tempId,
      conversationId: conversation.id,
      body: payload.content,
      senderId: currentUserId,
      messageType: (payload.messageType as any) || 'TEXT',
      ...(payload.attachments ? { attachments: payload.attachments } : {}),
      replyToId: replyingTo?.id || null,
      replyTo: replyingTo ? { id: replyingTo.id, content: replyingTo.body || replyingTo.content || '', senderId: replyingTo.senderId, createdAt: replyingTo.createdAt, senderName: replyingTo.sender?.displayName || 'User' } : null,
      readAt: null,
      deliveryStatus: 'SENDING',
      createdAt: new Date().toISOString(),
      sender: { id: currentUserId, displayName: 'You', avatarUrl: null },
    };

    setMessages((prev) => [...prev, optimistic]);
    setReplyingTo(null);
    scrollToBottom();

    try {
      if (socket?.connected) {
        socket.emit('chat:send', {
          conversationId: conversation.id,
          content: payload.content,
          messageType: payload.messageType,
          attachments: payload.attachments,
          replyToId: replyingTo?.id,
        });
      } else {
        const sent = await apiSendMessage(conversation.id, sendApiPayload);
        setMessages((prev) => prev.map((m) => (m.id === tempId ? sent : m)));
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, deliveryStatus: 'FAILED' } : m))
      );
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMessage || !editContent.trim()) return;

    try {
      await apiEditMessage(editingMessage.id, editContent);
      setMessages((prev) =>
        prev.map((m) => (m.id === editingMessage.id ? { ...m, body: editContent, editedAt: new Date().toISOString() } : m))
      );
      setEditingMessage(null);
    } catch (err) {
      alert('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await apiDeleteMessage(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch {
      alert('Failed to delete message');
    }
  };

  const handleTyping = (isTyping: boolean) => {
    socketRef.current?.emit('chat:typing', { conversationId: conversation.id, isTyping });
  };

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currDate = '';

    for (const msg of messages) {
      if (!currDate || isDifferentDay(currDate, msg.createdAt)) {
        currDate = msg.createdAt;
        groups.push({ date: currDate, messages: [msg] });
      } else {
        groups[groups.length - 1]?.messages.push(msg);
      }
    }
    return groups;
  }, [messages]);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-background/95 backdrop-blur shrink-0">
        <Link
          href={otherUser?.id ? `/sellers/${otherUser.id}` : '#'}
          target="_blank"
          className="flex items-center gap-3 group hover:opacity-90 transition-all cursor-pointer"
          title={`View ${otherUser?.displayName || 'User'}'s Profile`}
        >
          <div className="relative">
            <Avatar src={otherUser?.avatarUrl || null} alt={otherUser?.displayName || 'User'} size="sm" className="group-hover:ring-2 group-hover:ring-primary/40 transition-all" />
            <span
              className={cn(
                'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
                isOtherOnline ? 'bg-green-500' : 'bg-muted-foreground/30'
              )}
            />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
              <span>{otherUser?.displayName || 'User'}</span>
              <span className="text-[9px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">View Profile →</span>
              {isOtherOnline && <span className="text-[10px] text-green-600 font-normal">• Online</span>}
              {connected && <span className="text-[9px] text-blue-500 font-medium">⚡ Live</span>}
            </h3>
            <p className="text-[10px] text-muted-foreground group-hover:underline">{otherUser?.email || otherUser?.phone || 'Marketplace Member'}</p>
          </div>
        </Link>

        {/* Header Action Menu */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-destructive px-2"
            onClick={() => setModalMode('block')}
          >
            Block
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground px-2"
            onClick={() => {
              setReportTargetMessageId(undefined);
              setModalMode('report');
            }}
          >
            Report
          </Button>
        </div>
      </div>

      {/* Context Banner */}
      <div className="w-full bg-muted/20 border-b">
        <div className="max-w-2xl mx-auto w-full">
          <ContextCard conversation={conversation} />
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/60 dark:bg-slate-950/40">
        <div className="max-w-2xl mx-auto w-full space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-2 rounded-full bg-muted p-3">
                <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-foreground">Start the conversation</p>
              <p className="text-[11px] text-muted-foreground">Messages are end-to-end protected within the marketplace.</p>
            </div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.date}>
                <div className="my-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {formatDateSeparator(group.date)}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-2">
                  {group.messages.map((msg) => {
                    const isOwn = msg.senderId === currentUserId;

                    return (
                      <div
                        key={msg.id}
                        className={cn('flex flex-col group relative', isOwn ? 'items-end' : 'items-start')}
                      >
                        <div className="flex items-center gap-1.5 max-w-[75%] fashion-md:max-w-[65%]">
                          {!isOwn && (
                            <Avatar src={otherUser?.avatarUrl || null} alt={otherUser?.displayName || 'User'} size="xs" className="shrink-0 self-end mb-1" />
                          )}

                          <div
                            className={cn(
                              'rounded-2xl px-3.5 py-2.5 text-xs shadow-sm relative',
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-background text-foreground rounded-bl-none border border-border/80 shadow-sm'
                            )}
                          >
                            <RichMessageRenderer message={msg} isOwn={isOwn} />

                            {/* Footer Info: Time & Read Receipts */}
                            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-80">
                              {msg.editedAt && <span className="italic">(edited)</span>}
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isOwn && (
                                <span>
                                  {msg.deliveryStatus === 'READ' || msg.readAt ? (
                                    <span className="text-blue-300 font-bold">✓✓</span>
                                  ) : msg.deliveryStatus === 'FAILED' ? (
                                    <span className="text-destructive font-bold">⚠️ Failed</span>
                                  ) : (
                                    <span>✓</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hover Action Menu */}
                          <div className="hidden group-hover:flex items-center gap-1 shrink-0 bg-background/80 border rounded-md p-1 shadow-sm">
                            <button
                              type="button"
                              onClick={() => setReplyingTo(msg)}
                              className="text-[10px] text-muted-foreground hover:text-foreground p-0.5"
                              title="Reply"
                            >
                              ↩ Reply
                            </button>
                            {isOwn && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMessage(msg);
                                    setEditContent(msg.body || msg.content || '');
                                  }}
                                  className="text-[10px] text-muted-foreground hover:text-foreground p-0.5"
                                  title="Edit"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="text-[10px] text-destructive hover:underline p-0.5"
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
                            {!isOwn && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReportTargetMessageId(msg.id);
                                  setModalMode('report');
                                }}
                                className="text-[10px] text-muted-foreground hover:text-destructive p-0.5"
                                title="Report message"
                              >
                                🚩
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Animated Real-Time Typing Indicator */}
          {typingName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1 py-1">
              <div className="flex items-center gap-1.5 bg-background px-3.5 py-1.5 rounded-full border border-border/60 shadow-sm backdrop-blur">
                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
                <span className="text-[11px] font-medium text-foreground ml-1">{typingName} is typing...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Editing Banner */}
      {editingMessage && (
        <form onSubmit={handleEditSubmit} className="border-t bg-amber-50 dark:bg-amber-950/40 p-2 flex items-center gap-2 text-xs">
          <span className="font-semibold text-amber-900 dark:text-amber-200">Editing Message:</span>
          <input
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="flex-1 rounded border p-1 bg-background text-xs"
            autoFocus
          />
          <Button type="submit" size="sm" className="h-7 text-xs">Save</Button>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditingMessage(null)}>Cancel</Button>
        </form>
      )}

      {/* Quoted Reply Banner */}
      {replyingTo && (
        <div className="border-t bg-muted/60 p-2 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-primary">Replying to {replyingTo.sender?.displayName || 'User'}:</span>
            <p className="truncate text-muted-foreground text-[11px] max-w-md">{replyingTo.body || replyingTo.content}</p>
          </div>
          <button type="button" onClick={() => setReplyingTo(null)} className="text-muted-foreground hover:text-foreground font-bold text-sm">
            ✕
          </button>
        </div>
      )}

      {/* Composer Input Area */}
      <MessageComposer onSend={handleSendMessage} onTyping={handleTyping} disabled={false} />

      {/* Block & Report Dialog */}
      {modalMode && (
        <BlockReportModal
          isOpen={!!modalMode}
          mode={modalMode}
          targetUser={otherUser}
          {...(reportTargetMessageId ? { targetMessageId: reportTargetMessageId } : {})}
          conversationId={conversation.id}
          onClose={() => setModalMode(null)}
          onSuccess={() => {
            alert(modalMode === 'block' ? 'User blocked successfully' : 'Report submitted to moderation');
          }}
        />
      )}
    </div>
  );
}
