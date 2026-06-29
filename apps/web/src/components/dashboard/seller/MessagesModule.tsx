'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton, cn } from '@marketplace/ui';
import React from 'react';

import type { MessagePreview } from '../../../lib/dashboardApi';
import { formatRelativeTime } from '../../../lib/formatters';
import type { Lang } from '../../../lib/i18n';
import { t } from '../../../lib/i18n';

interface MessagesModuleProps {
  messages: MessagePreview[] | undefined;
  isLoading: boolean;
  lang: Lang;
  avgResponseHours: number;
  onOpenConversation: (conversationId: string) => void;
  activeFilter: 'all' | 'inquiry' | 'order' | 'rental' | 'custom';
  onFilterChange: (f: 'all' | 'inquiry' | 'order' | 'rental' | 'custom') => void;
}

const FILTERS: { value: 'all' | 'inquiry' | 'order' | 'rental' | 'custom'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'inquiry', label: 'Inquiries' },
  { value: 'order', label: 'Orders' },
  { value: 'rental', label: 'Rentals' },
  { value: 'custom', label: 'Custom' },
];

function ResponseTimeIndicator({ hours, lang }: { hours: number; lang: Lang }) {
  const isGood = hours < 2;
  const isWarning = hours > 6;

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', isGood ? 'text-brand-green' : isWarning ? 'text-warning' : 'text-muted-foreground')}>
      {isGood && (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {isWarning && (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
        </svg>
      )}
      {!isGood && !isWarning && (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span>
        {t('messages_response_time', lang)}{' '}
        <strong>{hours < 1 ? `${Math.round(hours * 60)} min` : `${hours.toFixed(1)} hours`}</strong>
        {isWarning && ' — buyers want faster replies!'}
      </span>
    </div>
  );
}

export default function MessagesModule({
  messages,
  isLoading,
  lang,
  avgResponseHours,
  onOpenConversation,
  activeFilter,
  onFilterChange,
}: MessagesModuleProps) {
  const filtered = (messages ?? []).filter(
    (m) => activeFilter === 'all' || m.type === activeFilter
  );
  const unreadCount = (messages ?? []).filter((m) => m.isUnread).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{t('messages_title', lang)}</CardTitle>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <a href="/dashboard/messages" className="text-xs font-medium text-primary hover:underline">
            {t('view_all', lang)} →
          </a>
        </div>

        {/* Response time */}
        {!isLoading && (
          <ResponseTimeIndicator hours={avgResponseHours} lang={lang} />
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium transition-all',
                activeFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium">{t('empty_no_messages_title', lang)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('empty_no_messages_desc', lang)}</p>
          </div>
        ) : (
          <div className="space-y-1.5" role="list" aria-label="Message previews">
            {filtered.slice(0, 3).map((msg) => (
              <button
                key={msg.id}
                onClick={() => onOpenConversation(msg.conversationId)}
                className="group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm active:scale-[0.99]"
                role="listitem"
              >
                {/* Avatar */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-gold/30 to-brand-terra/30 text-sm font-bold text-foreground">
                  {msg.customerName.charAt(0).toUpperCase()}
                  {msg.isUnread && (
                    <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-destructive" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('truncate text-sm', msg.isUnread ? 'font-semibold' : 'font-medium')}>
                      {msg.customerName}
                    </p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatRelativeTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className={cn('truncate text-xs', msg.isUnread ? 'text-foreground' : 'text-muted-foreground')}>
                    {msg.snippet.length > 50 ? `${msg.snippet.slice(0, 47)}...` : msg.snippet}
                  </p>
                </div>

                <svg className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:text-primary group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Quick reply CTA */}
        {unreadCount > 0 && !isLoading && (
          <a
            href="/dashboard/messages"
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary/5 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary/10 active:scale-[0.99]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply now to stay responsive
          </a>
        )}
      </CardContent>
    </Card>
  );
}
