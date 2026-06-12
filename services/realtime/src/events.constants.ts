/** Socket.IO event names — keep in sync with client SDK. */
export const CHAT_CLIENT_EVENTS = {
  SEND: 'chat:send',
  TYPING: 'chat:typing',
  READ: 'chat:read',
  JOIN: 'chat:join',
} as const;

export const CHAT_SERVER_EVENTS = {
  NEW_MESSAGE: 'chat:new_message',
  USER_TYPING: 'chat:user_typing',
  MESSAGE_READ: 'chat:message_read',
  USER_ONLINE: 'chat:user_online',
  USER_OFFLINE: 'chat:user_offline',
  ERROR: 'chat:error',
  JOINED: 'chat:joined',
} as const;

export const NOTIFICATIONS_SERVER_EVENTS = {
  NEW_NOTIFICATION: 'notifications:new',
  NOTIFICATION_READ: 'notifications:read',
  NOTIFICATION_READ_ALL: 'notifications:read_all',
  UNREAD_COUNT: 'notifications:unread_count',
} as const;

/** In-process domain events (moderation / notifications). */
export const CHAT_DOMAIN_EVENTS = {
  MESSAGE_SENT: 'chat.message_sent',
  SPAM_SUSPECTED: 'chat.spam_suspected',
  REPORT_READY: 'chat.report_ready',
  USER_BLOCKED: 'chat.user_blocked',
} as const;

export const PRESENCE_REDIS_KEYS = {
  USER_SOCKETS: 'mp:presence:user:',
  SOCKET_USER: 'mp:presence:socket:',
  LAST_SEEN: 'mp:presence:lastseen:',
  TYPING: 'mp:chat:typing:',
  UNREAD: 'mp:chat:unread:',
} as const;

export const SESSION_REDIS_KEYS = {
  SESSION: 'mp:session:',
  BLACKLIST: 'mp:blacklist:access:',
} as const;

export const RATE_LIMIT_CHAT_PREFIX = 'chat' as const;

export function conversationRoomId(conversationId: string): string {
  return `conversation:${conversationId}`;
}

export function userRoom(userId: string): string {
  return `user:${userId}`;
}
