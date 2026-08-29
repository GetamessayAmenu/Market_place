"use client";
import React from 'react';
import { Badge, cn } from '@marketplace/ui';
import type { ChatMessage } from '../../lib/chatApi';

interface RichMessageRendererProps {
  message: ChatMessage;
  isOwn: boolean;
}

export default function RichMessageRenderer({ message, isOwn }: RichMessageRendererProps) {
  // System message pill
  if (message.messageType === 'SYSTEM') {
    return (
      <div className="my-2 flex justify-center">
        <Badge variant="outline" className="text-[11px] bg-muted/50 px-3 py-1 font-medium">
          {message.body || message.content}
        </Badge>
      </div>
    );
  }

  // Parse structured JSON metadata if content is JSON string
  let parsedContent: any = null;
  if (message.body && message.body.startsWith('{') && message.body.endsWith('}')) {
    try {
      parsedContent = JSON.parse(message.body);
    } catch {
      parsedContent = null;
    }
  }

  return (
    <div className="space-y-2">
      {/* Quoted Reply Preview */}
      {message.replyTo && (
        <div
          className={cn(
            'border-l-2 pl-2 py-1 text-xs rounded bg-muted/40 mb-1',
            isOwn ? 'border-primary-foreground/50' : 'border-primary/50'
          )}
        >
          <span className="font-semibold block text-[11px] text-muted-foreground">
            Replying to {message.replyTo.senderName}:
          </span>
          <p className="truncate text-foreground/80 italic">{message.replyTo.content}</p>
        </div>
      )}

      {/* Main Text Content */}
      {message.body && !parsedContent && (
        <p className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed">
          {message.body}
        </p>
      )}

      {/* Structured Custom Quote */}
      {parsedContent?.type === 'custom_quote' && (
        <div className="rounded-lg border bg-background/80 p-3 text-xs space-y-1.5 shadow-sm text-foreground">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="border-blue-500 text-blue-600 font-bold">
              Custom Quote
            </Badge>
            <span className="font-bold text-sm text-primary">
              ETB {Number(parsedContent.proposedPrice).toLocaleString()}
            </span>
          </div>
          {parsedContent.proposedDeposit && (
            <p className="text-[11px] text-muted-foreground">
              Security Deposit: <span className="font-semibold text-foreground">ETB {parsedContent.proposedDeposit}</span>
            </p>
          )}
          {parsedContent.notes && (
            <p className="text-xs italic text-muted-foreground border-t pt-1">
              "{parsedContent.notes}"
            </p>
          )}
        </div>
      )}

      {/* Image Attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div
          className={cn(
            'grid gap-1.5 mt-1.5',
            message.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          )}
        >
          {message.attachments.map((att, idx) => (
            <a
              key={idx}
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-lg border bg-muted"
            >
              <img
                src={att.url}
                alt={att.name || `Attachment ${idx + 1}`}
                className="max-h-60 w-full object-cover transition-transform group-hover:scale-105"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
