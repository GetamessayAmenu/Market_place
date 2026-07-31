import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '../../lib/api';

export interface Conversation {
  id: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  relatedOrder?: {
    id: string;
    title: string;
    model: 'sale' | 'rental' | 'custom';
  };
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export function useConversations(sellerId: string, filter?: 'all' | 'unread' | 'with_order') {
  return useQuery<Conversation[]>({
    queryKey: ['conversations', sellerId, filter],
    queryFn: async () => {
      const res = await apiGet<Conversation[]>('/seller/conversations', filter ? { filter } : undefined);
      return res;
    },
    enabled: !!sellerId,
  });
}

export function useConversationMessages(conversationId: string) {
  return useQuery<Message[]>({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async () => {
      const res = await apiGet<Message[]>(`/seller/conversations/${conversationId}/messages`);
      return res;
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      apiPost(`/seller/conversations/${conversationId}/messages`, { content }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['conversation-messages'] });
      void qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => apiPatch(`/seller/conversations/${conversationId}/read`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
