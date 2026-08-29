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
  USER_RESTRICTED: 'chat:user_restricted',
} as const;

export const ADMIN_SERVER_EVENTS = {
  NEW_REPORT: 'admin:new_report',
  HIGH_RISK_ALERT: 'admin:high_risk_alert',
  MESSAGING_RESTRICTED: 'admin:messaging_restricted',
} as const;

export const ORDER_CLIENT_EVENTS = {
  JOIN_ORDER_CHAT: 'order:join_chat',
  LEAVE_ORDER_CHAT: 'order:leave_chat',
  SEND_ORDER_MESSAGE: 'order:send_message',
  REQUEST_QUOTE: 'order:request_quote',
  ACCEPT_QUOTE: 'order:accept_quote',
  UPDATE_STATUS: 'order:update_status',
} as const;

export const ORDER_SERVER_EVENTS = {
  ORDER_MESSAGE: 'order:message',
  QUOTE_RECEIVED: 'order:quote_received',
  QUOTE_PROPOSED: 'order:quote_proposed',
  QUOTE_ACCEPTED: 'order:quote_accepted',
  ORDER_DECLINED: 'order:declined',
  ALTERNATIVE_DATES_PROPOSED: 'order:alternative_dates_proposed',
  TAILORING_MILESTONE_UPDATED: 'order:tailoring_milestone_updated',
  EXTENSION_REQUESTED: 'order:extension_requested',
  EXTENSION_RESPONDED: 'order:extension_responded',
  STATUS_UPDATED: 'order:status_updated',
  ORDER_JOINED: 'order:joined',
  ORDER_ERROR: 'order:error',
  PRE_HANDOVER_PHOTOS_UPLOADED: 'order:pre_handover_photos_uploaded',
  POST_RETURN_PHOTOS_UPLOADED: 'order:post_return_photos_uploaded',
} as const;

export const NOTIFICATIONS_SERVER_EVENTS = {
  NEW_NOTIFICATION: 'notifications:new',
  NOTIFICATION_READ: 'notifications:read',
  NOTIFICATION_READ_ALL: 'notifications:read_all',
  UNREAD_COUNT: 'notifications:unread_count',
  LISTING_MODERATED: 'listing:moderated',
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
