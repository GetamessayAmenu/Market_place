import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const chatAxios = axios.create({ baseURL: API_BASE, withCredentials: true });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ChatListing {
  id: string;
  title: string;
  slug: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  body: string;
  senderId: string;
  readAt: string | null;
  createdAt: string;
  sender: ChatUser;
}

export interface ChatConversation {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string | null;
  createdAt: string;
  listing: ChatListing;
  buyer: ChatUser;
  seller: ChatUser;
  unreadCount?: number;
  lastMessage?: ChatMessage | null;
}

export interface ConversationsResponse {
  data: ChatConversation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface MessagesResponse {
  data: ChatMessage[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ─── API Calls ───────────────────────────────────────────────────────────────

export async function fetchConversations(page = 1, limit = 20): Promise<ConversationsResponse> {
  const res = await chatAxios.get<ConversationsResponse>('/conversations', { params: { page, limit } });
  return res.data;
}

export async function fetchConversationMessages(conversationId: string, page = 1, limit = 50): Promise<MessagesResponse> {
  const res = await chatAxios.get<MessagesResponse>(`/conversations/${conversationId}/messages`, { params: { page, limit } });
  return res.data;
}

export async function markConversationRead(conversationId: string, messageIds?: string[]): Promise<{ conversationId: string; markedCount: number }> {
  const body = messageIds ? { messageIds } : {};
  const res = await chatAxios.post<{ conversationId: string; markedCount: number }>(`/conversations/${conversationId}/read`, body);
  return res.data;
}

export async function sendMessage(conversationId: string, body: string): Promise<ChatMessage> {
  const res = await chatAxios.post<ChatMessage>(`/conversations/${conversationId}/messages`, { body });
  return res.data;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get the "other" user in a conversation given the current user ID */
export function getOtherUser(conv: ChatConversation, currentUserId: string): ChatUser {
  return conv.buyerId === currentUserId ? conv.seller : conv.buyer;
}

/** Get the role of the current user in a conversation */
export function getUserRole(conv: ChatConversation, currentUserId: string): 'buyer' | 'seller' {
  return conv.buyerId === currentUserId ? 'buyer' : 'seller';
}

/** Format relative time for conversation list */
export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return String(diffMin) + 'm';
  if (diffHr < 24) return String(diffHr) + 'h';
  if (diffDay < 7) return String(diffDay) + 'd';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Format time for message bubbles */
export function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/** Check if two messages are on different days (for date separators) */
export function isDifferentDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.toDateString() !== db.toDateString();
}

/** Format date separator label */
export function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
