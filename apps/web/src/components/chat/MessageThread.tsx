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
import QuickRepliesBar from './QuickRepliesBar';
import RentalInquiryModal from './RentalInquiryModal';
import CustomOrderInquiryModal from './CustomOrderInquiryModal';

interface MessageThreadProps {
  conversation: ChatConversation;
  currentUserId: string;
  initialMessages?: ChatMessage[];
  initialStarterText?: string;
  onToggleRightPanel?: () => void;
  showRightPanelToggle?: boolean;
}

export default function MessageThread({
  conversation,
  currentUserId,
  initialMessages = [],
  initialStarterText = '',
  onToggleRightPanel,
  showRightPanelToggle,
}: MessageThreadProps) {
  const socketRef = useSocket('/chat');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isOtherOnline, setIsOtherOnline] = useState(false);

  const [typingName, setTypingName] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editContent, setEditContent] = useState('');
  const [starterText, setStarterText] = useState(initialStarterText);

  const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);

  // Secondary Menu Dropdown
  const [showSecondaryMenu, setShowSecondaryMenu] = useState(false);


  // Inquiry Modals
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false);

  // Block & Report Modal
  const [modalMode, setModalMode] = useState<'block' | 'report' | null>(null);
  const [reportTargetMessageId, setReportTargetMessageId] = useState<string | undefined>(undefined);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isBuyer = conversation.buyerId === currentUserId;
  const otherUser = useMemo(() => getOtherUser(conversation, currentUserId), [conversation?.id, currentUserId]);

  const transactionType = conversation.rental || conversation.listing?.availableForRent
    ? 'RENT'
    : conversation.customOrderRef || conversation.listing?.customOrderAvailable
    ? 'CUSTOM'
    : 'BUY';

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Fetch initial messages
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

  // Socket setup & event listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversation?.id) return;

    const onConnect = () => {
      socket.emit('chat:join', { conversationId: conversation.id });
    };

    const onDisconnect = () => {};

    if (socket.connected) {
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

  // Mark conversation read on view
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
    setStarterText('');
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

  const handleRetryMessage = async (msg: ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, deliveryStatus: 'SENDING' } : m)));
    try {
      const payload: { content: string; body?: string; messageType?: string; attachments?: any; replyToId?: string } = {
        content: msg.body || msg.content || '',
      };
      if (msg.messageType) payload.messageType = msg.messageType;
      if (msg.attachments) payload.attachments = msg.attachments;
      if (msg.replyToId) payload.replyToId = msg.replyToId;

      const sent = await apiSendMessage(conversation.id, payload);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? sent : m)));
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, deliveryStatus: 'FAILED' } : m)));
    }
  };


  const handleQuickReply = (text: string) => {
    handleSendMessage({ content: text, messageType: 'TEXT' });
  };

  const handleRentalInquirySubmit = (data: { startDate: string; endDate: string; notes?: string }) => {
    const payloadContent = JSON.stringify({
      type: 'rental_inquiry',
      ...data,
    });
    handleSendMessage({ content: payloadContent, messageType: 'TEXT' });
  };

  const handleCustomOrderInquirySubmit = (data: any) => {
    const payloadContent = JSON.stringify({
      type: 'custom_order_inquiry',
      ...data,
    });
    handleSendMessage({ content: payloadContent, messageType: 'TEXT' });
  };

  const handleCopyMessage = (body: string) => {
    navigator.clipboard.writeText(body);
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
    } catch {
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
    <div className="flex h-full flex-col bg-background relative">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b px-4 py-2.5 bg-card shrink-0">
        <Link
          href={`/sellers/${otherUser.id}`}
          target="_blank"
          className="flex items-center gap-3 group hover:opacity-90 transition-all min-w-0"
        >
          <div className="relative shrink-0">
            <Avatar src={otherUser.avatarUrl || null} alt={otherUser.displayName} size="md" />
            <span
              className={cn(
                'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
                isOtherOnline ? 'bg-green-500' : 'bg-muted-foreground/30'
              )}
            />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors flex items-center gap-1.5">
              <span>{otherUser.displayName}</span>
              {isOtherOnline ? (
                <span className="text-[10px] text-green-600 font-semibold">• Online</span>
              ) : (
                <span className="text-[10px] text-muted-foreground font-normal">Offline</span>
              )}
            </h3>
            <p className="text-[10px] text-muted-foreground truncate">{isBuyer ? 'Marketplace Seller' : 'Marketplace Buyer'}</p>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {showRightPanelToggle && onToggleRightPanel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleRightPanel}
              className="h-7 text-xs font-semibold px-2.5 flex items-center gap-1"
            >
              <span>ℹ️</span> Details
            </Button>
          )}

          {/* Secondary Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSecondaryMenu((v) => !v)}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted font-bold text-sm"
              title="More Actions"
            >
              ⋮
            </button>

            {showSecondaryMenu && (
              <div className="absolute right-0 top-8 z-30 w-44 rounded-xl border bg-popover p-1 shadow-xl text-xs space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowSecondaryMenu(false);
                    markConversationRead(conversation.id).catch(() => {});
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-muted rounded-lg font-medium text-foreground"
                >
                  Mark as Unread
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSecondaryMenu(false);
                    setModalMode('block');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-destructive/10 text-destructive rounded-lg font-medium"
                >
                  Block User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSecondaryMenu(false);
                    setReportTargetMessageId(undefined);
                    setModalMode('report');
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-muted rounded-lg font-medium text-foreground"
                >
                  Report Conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Listing Context Banner */}
      <ContextCard conversation={conversation} currentUserId={currentUserId} />

      {/* Messages Scroll Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/60 dark:bg-slate-950/40">
        <div className="max-w-3xl mx-auto w-full space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-xs font-bold text-foreground">Start the conversation about this listing.</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Direct & secure marketplace messaging.</p>
            </div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date Separators */}
                <div className="my-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-card px-2.5 py-0.5 rounded-full border shadow-2xs">
                    {formatDateSeparator(group.date)}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-2.5">
                  {group.messages.map((msg) => {
                    const isOwn = msg.senderId === currentUserId;

                    return (
                      <div
                        key={msg.id}
                        className={cn('flex flex-col group relative', isOwn ? 'items-end' : 'items-start')}
                      >
                        <div className="flex items-center gap-1.5 max-w-[85%] sm:max-w-[70%]">
                          {!isOwn && (
                            <Avatar src={otherUser.avatarUrl || null} alt={otherUser.displayName} size="xs" className="shrink-0 self-end mb-1" />
                          )}

                          <div
                            className={cn(
                              'rounded-2xl px-3.5 py-2.5 text-xs shadow-xs relative',
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-xs'
                                : 'bg-card text-card-foreground rounded-bl-xs border border-border/70 shadow-2xs'
                            )}
                          >
                            <RichMessageRenderer message={msg} isOwn={isOwn} />

                            {/* Timestamp & Read Receipts */}
                            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-80">
                              {msg.editedAt && <span className="italic">(edited)</span>}
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isOwn && (
                                <span>
                                  {msg.deliveryStatus === 'READ' || msg.readAt ? (
                                    <span className="text-blue-300 font-extrabold">✓✓</span>
                                  ) : msg.deliveryStatus === 'FAILED' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRetryMessage(msg)}
                                      className="text-destructive font-bold hover:underline ml-1"
                                    >
                                      ⚠️ Failed (Retry)
                                    </button>
                                  ) : (
                                    <span>✓</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Message 3-Dot Menu Dropdown */}
                          <div className="relative shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id)}
                              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted font-bold text-xs leading-none"
                              title="Message options"
                            >
                              ⋮
                            </button>

                            {activeMessageMenuId === msg.id && (
                              <div
                                className={cn(
                                  "absolute top-6 z-30 w-36 rounded-xl border bg-popover p-1 shadow-xl text-xs space-y-0.5 animate-in fade-in duration-100",
                                  isOwn ? "right-0" : "left-0"
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMessageMenuId(null);
                                    setReplyingTo(msg);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-muted rounded-lg font-medium text-foreground flex items-center gap-1.5"
                                >
                                  <span>↩</span> Reply
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMessageMenuId(null);
                                    handleCopyMessage(msg.body || msg.content || '');
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-muted rounded-lg font-medium text-foreground flex items-center gap-1.5"
                                >
                                  <span>📋</span> Copy Text
                                </button>

                                {isOwn && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMessageMenuId(null);
                                        setEditingMessage(msg);
                                        setEditContent(msg.body || msg.content || '');
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-muted rounded-lg font-medium text-foreground flex items-center gap-1.5"
                                    >
                                      <span>✏️</span> Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMessageMenuId(null);
                                        handleDeleteMessage(msg.id);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-destructive/10 text-destructive rounded-lg font-medium flex items-center gap-1.5"
                                    >
                                      <span>🗑️</span> Delete
                                    </button>
                                  </>
                                )}

                                {!isOwn && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMessageMenuId(null);
                                      setReportTargetMessageId(msg.id);
                                      setModalMode('report');
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-muted text-muted-foreground hover:text-destructive rounded-lg font-medium flex items-center gap-1.5"
                                  >
                                    <span>🚩</span> Report
                                  </button>
                                )}
                              </div>
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

          {/* Typing Indicator */}
          {typingName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-1 py-1">
              <div className="flex items-center gap-1.5 bg-card px-3.5 py-1.5 rounded-full border shadow-2xs">
                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
                <span className="text-[11px] font-semibold text-foreground ml-1">{typingName} is typing...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Editing Banner */}
      {editingMessage && (
        <form onSubmit={handleEditSubmit} className="border-t bg-amber-50 dark:bg-amber-950/40 p-2 flex items-center gap-2 text-xs">
          <span className="font-bold text-amber-900 dark:text-amber-200">Editing Message:</span>
          <input
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="flex-1 rounded-lg border p-1 bg-background text-xs"
            autoFocus
          />
          <Button type="submit" size="sm" className="h-7 text-xs font-bold">Save</Button>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs font-bold" onClick={() => setEditingMessage(null)}>Cancel</Button>
        </form>
      )}

      {/* Quoted Reply Banner */}
      {replyingTo && (
        <div className="border-t bg-muted/60 p-2 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-primary">Replying to {replyingTo.sender?.displayName || 'User'}:</span>
            <p className="truncate text-muted-foreground text-[11px] max-w-md">{replyingTo.body || replyingTo.content}</p>
          </div>
          <button type="button" onClick={() => setReplyingTo(null)} className="text-muted-foreground hover:text-foreground font-bold text-sm">
            ✕
          </button>
        </div>
      )}

      {/* Contextual Quick Replies Bar */}
      <QuickRepliesBar
        role={isBuyer ? 'buyer' : 'seller'}
        transactionType={transactionType}
        onSelectQuickReply={handleQuickReply}
        onOpenRentalInquiry={() => setShowRentalModal(true)}
        onOpenCustomOrderInquiry={() => setShowCustomOrderModal(true)}
      />

      {/* Message Composer */}
      <MessageComposer
        onSend={handleSendMessage}
        onTyping={handleTyping}
        initialText={starterText}
      />

      {/* Rental & Custom Order Inquiry Modals */}
      {showRentalModal && (
        <RentalInquiryModal
          isOpen={showRentalModal}
          onClose={() => setShowRentalModal(false)}
          onSubmit={handleRentalInquirySubmit}
          dailyRate={conversation.listing?.rentalPricePerDay ? Number(conversation.listing.rentalPricePerDay) : undefined}
        />
      )}

      {showCustomOrderModal && (
        <CustomOrderInquiryModal
          isOpen={showCustomOrderModal}
          onClose={() => setShowCustomOrderModal(false)}
          onSubmit={handleCustomOrderInquirySubmit}
        />
      )}

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
