import { Avatar, cn } from '@marketplace/ui';
import React from 'react';

import type { ChatMessage } from '../../lib/chatApi';
import { formatMessageTime } from '../../lib/chatApi';
import { parseRichMessage } from '../../lib/richMessage';

import RichMessageRenderer from './RichMessageRenderer';

// ─── Props ───────────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  senderName: string;
  senderAvatar: string | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  senderName,
  senderAvatar,
}: MessageBubbleProps) {
  const rich = parseRichMessage(message.body);

  // System messages render as centered banners
  if (rich.type === 'system') {
    return (
      <div className="flex justify-center py-2">
        <div className="rounded-full bg-muted px-4 py-1.5 text-center text-xs text-muted-foreground">
          {rich.systemAction?.replace(/_/g, ' ') ?? rich.body}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-2 px-4',
        isOwn ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar */}
      <div className={cn('w-8 shrink-0', !showAvatar && 'invisible')}>
        {showAvatar && (
          <Avatar
            src={senderAvatar}
            alt={senderName}
            size="sm"
          />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3.5 py-2',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-tr-md'
            : 'bg-muted text-foreground rounded-tl-md',
        )}
      >
        {/* Sender name (only for received messages in group) */}
        {!isOwn && showAvatar && (
          <p className="mb-0.5 text-xs font-medium text-muted-foreground">
            {senderName}
          </p>
        )}

        {/* Rich content or plain text */}
        <RichMessageRenderer message={message} isOwn={isOwn} />

        {/* Attachments */}
        {rich.attachments && rich.attachments.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {rich.attachments.map((att, i) => (
              <div key={i}>
                {att.type === 'image' ? (
                  <a href={att.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={att.url}
                      alt={att.name}
                      className="max-h-48 rounded-lg object-cover"
                    />
                  </a>
                ) : (
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs',
                      isOwn ? 'border-primary-foreground/20' : 'border-border',
                    )}
                  >
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                    <span className="truncate">{att.name}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Timestamp + read receipt */}
        <div
          className={cn(
            'mt-1 flex items-center gap-1.5 text-[10px]',
            isOwn ? 'justify-end text-primary-foreground/60' : 'text-muted-foreground',
          )}
        >
          <span>{formatMessageTime(message.createdAt)}</span>
          {isOwn && message.readAt && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
