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

  // Parse structured JSON metadata if body is a JSON string
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
        <div className="rounded-xl border bg-card p-3 text-xs space-y-1.5 shadow-xs text-foreground">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="border-blue-500 text-blue-600 dark:text-blue-400 font-bold">
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

      {/* Structured Rental Availability Inquiry */}
      {parsedContent?.type === 'rental_inquiry' && (
        <div className="rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/40 p-3 text-xs space-y-2 text-foreground">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
              <span>📅</span> Rental Inquiry Request
            </span>
            <Badge variant="outline" className="border-purple-400 text-purple-700 dark:text-purple-300">
              Rental Inquiry
            </Badge>
          </div>
          <div className="space-y-1 text-[11px]">
            <p><span className="font-semibold text-muted-foreground">Start Date:</span> {parsedContent.startDate}</p>
            <p><span className="font-semibold text-muted-foreground">End Date:</span> {parsedContent.endDate}</p>
            {parsedContent.notes && <p className="italic text-muted-foreground">"{parsedContent.notes}"</p>}
          </div>
        </div>
      )}

      {/* Structured Custom Order Request */}
      {parsedContent?.type === 'custom_order_inquiry' && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 p-3 text-xs space-y-2 text-foreground">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <span>✨</span> Custom Order Request
            </span>
            <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300">
              Custom Specs
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            {parsedContent.size && <p><span className="font-semibold text-muted-foreground">Size:</span> {parsedContent.size}</p>}
            {parsedContent.color && <p><span className="font-semibold text-muted-foreground">Color:</span> {parsedContent.color}</p>}
            {parsedContent.fabric && <p><span className="font-semibold text-muted-foreground">Fabric:</span> {parsedContent.fabric}</p>}
            {parsedContent.embroidery && <p className="col-span-2"><span className="font-semibold text-muted-foreground">Embroidery:</span> {parsedContent.embroidery}</p>}
            {parsedContent.personalization && <p className="col-span-2"><span className="font-semibold text-muted-foreground">Personalization:</span> {parsedContent.personalization}</p>}
            {parsedContent.notes && <p className="col-span-2 italic text-muted-foreground border-t pt-1">"{parsedContent.notes}"</p>}
          </div>
        </div>
      )}

      {/* Image Gallery Attachments */}
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
              className="group relative overflow-hidden rounded-xl border bg-muted"
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
