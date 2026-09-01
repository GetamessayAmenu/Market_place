import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const chatAxios = axios.create({ baseURL: API_BASE, withCredentials: true });

// Attach JWT token from localStorage or cookie if available
chatAxios.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

function unwrap<T>(body: any): T {
  let result = body?.data !== undefined ? body.data : body;
  if (result && typeof result === 'object' && result.data !== undefined && (result.success !== undefined || result.meta !== undefined)) {
    result = result.data;
  }
  return result as T;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email?: string;
  phone?: string | null;
}

export interface ChatListing {
  id: string;
  title: string;
  slug: string;
  price?: number;
  currency?: string;
  status?: string;
  images?: { url: string; cloudinaryPublicId?: string }[];
  availableForRent?: boolean;
  customOrderAvailable?: boolean;
  rentalPricePerDay?: number | string;
  supportsCustomDesign?: boolean;
  startingCustomPrice?: number | string;
}


export interface ChatOrder {
  id: string;
  orderNumber: string;
  status: string;
  agreedPrice: number;
  type: string;
}

export interface ChatRental {
  id: string;
  orderNumber: string;
  status: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
  totalAmount: number;
}

export interface ChatCustomOrder {
  id: string;
  status: string;
  agreedPrice?: number | null;
  selectedColor?: string | null;
  selectedFabric?: string | null;
  selectedSize?: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  body: string;
  content?: string;
  senderId: string;
  messageType?: 'TEXT' | 'IMAGE' | 'LISTING_PREVIEW' | 'ORDER_REF' | 'RENTAL_REF' | 'CUSTOM_ORDER_REF' | 'SYSTEM' | 'CUSTOM_QUOTE';
  attachments?: { url: string; publicId?: string; type?: string; name?: string; size?: number }[];
  replyToId?: string | null;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    senderName: string;
  } | null;
  readAt: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  deliveryStatus?: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  createdAt: string;
  sender: ChatUser;
}

export interface ChatConversation {
  id: string;
  listingId: string | null;
  orderId?: string | null;
  rentalId?: string | null;
  customOrderId?: string | null;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string | null;
  createdAt: string;
  listing?: ChatListing | null;
  order?: ChatOrder | null;
  rental?: ChatRental | null;
  customOrderRef?: ChatCustomOrder | null;
  buyer: ChatUser;
  seller: ChatUser;
  unreadCount?: number;
  lastMessage?: ChatMessage | null;
}

export interface ConversationsResponse {
  data: ChatConversation[];
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface MessagesResponse {
  data: ChatMessage[];
}

// ─── API Calls ───────────────────────────────────────────────────────────────

export async function fetchConversations(): Promise<ChatConversation[]> {
  const res = await chatAxios.get('/chat/conversations');
  const items = unwrap<ChatConversation[]>(res.data);
  return Array.isArray(items) ? items : [];
}

export async function fetchConversationMessages(conversationId: string, limit = 50, offset = 0): Promise<{ data: ChatMessage[] }> {
  const res = await chatAxios.get(`/chat/conversations/${conversationId}/messages`, { params: { limit, offset } });
  const items = unwrap<ChatMessage[]>(res.data);
  return { data: Array.isArray(items) ? items : [] };
}

export async function findOrCreateConversation(sellerId: string, context?: { listingId?: string; orderId?: string; rentalId?: string; customOrderId?: string }): Promise<ChatConversation> {
  const res = await chatAxios.post('/chat/conversations/find-or-create', {
    sellerId,
    ...(context?.listingId && { listingId: context.listingId }),
    ...(context?.orderId && { orderId: context.orderId }),
    ...(context?.rentalId && { rentalId: context.rentalId }),
    ...(context?.customOrderId && { customOrderId: context.customOrderId }),
  });
  return unwrap<ChatConversation>(res.data);
}

export async function sendMessage(
  conversationId: string,
  payload: {
    content: string;
    body?: string;
    messageType?: string;
    attachments?: any;
    replyToId?: string;
  }
): Promise<ChatMessage> {
  const res = await chatAxios.post(`/chat/conversations/${conversationId}/messages`, {
    content: payload.content || payload.body || '',
    body: payload.content || payload.body || '',
    messageType: payload.messageType,
    attachments: payload.attachments,
    replyToId: payload.replyToId,
  });
  return unwrap<ChatMessage>(res.data);
}

export async function editMessage(messageId: string, content: string): Promise<ChatMessage> {
  const res = await chatAxios.patch(`/chat/messages/${messageId}`, { content });
  return unwrap<ChatMessage>(res.data);
}

export async function deleteMessage(messageId: string): Promise<{ success: boolean }> {
  const res = await chatAxios.delete(`/chat/messages/${messageId}`);
  return unwrap<{ success: boolean }>(res.data);
}

export async function markConversationRead(conversationId: string): Promise<{ success: boolean }> {
  const res = await chatAxios.post(`/chat/conversations/${conversationId}/read`);
  return unwrap<{ success: boolean }>(res.data);
}

export async function blockUser(targetUserId: string, reason?: string): Promise<{ success: boolean }> {
  const res = await chatAxios.post(`/chat/users/${targetUserId}/block`, { reason });
  return unwrap<{ success: boolean }>(res.data);
}

export async function unblockUser(targetUserId: string): Promise<{ success: boolean }> {
  const res = await chatAxios.post(`/chat/users/${targetUserId}/unblock`);
  return unwrap<{ success: boolean }>(res.data);
}

export async function reportMessageOrUser(params: {
  targetType: 'message' | 'user' | 'conversation';
  reportedUserId?: string;
  messageId?: string;
  conversationId?: string;
  reason: string;
  description?: string;
}): Promise<{ id: string }> {
  const res = await chatAxios.post('/reports', params);
  return unwrap<{ id: string }>(res.data);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getOtherUser(conv: ChatConversation, currentUserId: string): ChatUser {
  if (!conv) {
    return { id: 'unknown', displayName: 'User', avatarUrl: null };
  }
  const other = conv.buyerId === currentUserId ? conv.seller : conv.buyer;
  if (other && typeof other === 'object') {
    return {
      id: other.id || (conv.buyerId === currentUserId ? conv.sellerId : conv.buyerId),
      displayName: other.displayName || other.email || (conv.buyerId === currentUserId ? 'Seller' : 'Buyer'),
      avatarUrl: other.avatarUrl || null,
      ...(other.email ? { email: other.email } : {}),
      ...(other.phone !== undefined ? { phone: other.phone } : {}),
    };
  }
  return {
    id: conv.buyerId === currentUserId ? (conv.sellerId || 'seller') : (conv.buyerId || 'buyer'),
    displayName: conv.buyerId === currentUserId ? 'Seller' : 'Buyer',
    avatarUrl: null,
  };
}

export function getUserRole(conv: ChatConversation, currentUserId: string): 'buyer' | 'seller' {
  return conv.buyerId === currentUserId ? 'buyer' : 'seller';
}

export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function isDifferentDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.toDateString() !== db.toDateString();
}

export function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
