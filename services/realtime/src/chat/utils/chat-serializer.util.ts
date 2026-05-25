import type { ConversationWithParticipants, MessageWithSender } from '../chat.repository';

export interface SerializedMessage {
  readonly id: string;
  readonly conversationId: string;
  readonly body: string;
  readonly senderId: string;
  readonly readAt: string | null;
  readonly createdAt: string;
  readonly sender: {
    readonly id: string;
    readonly displayName: string;
    readonly avatarUrl: string | null;
  };
}

export interface SerializedConversation {
  readonly id: string;
  readonly listingId: string;
  readonly buyerId: string;
  readonly sellerId: string;
  readonly lastMessageAt: string | null;
  readonly createdAt: string;
  readonly listing: {
    readonly id: string;
    readonly title: string;
    readonly slug: string;
  };
  readonly buyer: {
    readonly id: string;
    readonly displayName: string;
    readonly avatarUrl: string | null;
  };
  readonly seller: {
    readonly id: string;
    readonly displayName: string;
    readonly avatarUrl: string | null;
  };
  readonly unreadCount?: number;
  readonly lastMessage?: SerializedMessage | null;
}

export function serializeMessage(message: MessageWithSender): SerializedMessage {
  return {
    id: message.id,
    conversationId: message.conversationId,
    body: message.body,
    senderId: message.senderId,
    readAt: message.readAt?.toISOString() ?? null,
    createdAt: message.createdAt.toISOString(),
    sender: message.sender,
  };
}

export function serializeConversation(
  conversation: ConversationWithParticipants,
  extras?: { unreadCount?: number; lastMessage?: MessageWithSender | null },
): SerializedConversation {
  return {
    id: conversation.id,
    listingId: conversation.listingId,
    buyerId: conversation.buyerId,
    sellerId: conversation.sellerId,
    lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    createdAt: conversation.createdAt.toISOString(),
    listing: conversation.listing,
    buyer: conversation.buyer,
    seller: conversation.seller,
    ...(extras?.unreadCount !== undefined ? { unreadCount: extras.unreadCount } : {}),
    ...(extras?.lastMessage
      ? { lastMessage: serializeMessage(extras.lastMessage) }
      : extras?.lastMessage === null
        ? { lastMessage: null }
        : {}),
  };
}
