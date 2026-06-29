'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton, cn } from '@marketplace/ui';
import React, { useState } from 'react';

import type { PendingAction } from '../../../lib/dashboardApi';
import { formatRelativeTime } from '../../../lib/formatters';
import type { Lang } from '../../../lib/i18n';
import { t } from '../../../lib/i18n';

interface PendingActionsModuleProps {
  actions: PendingAction[] | undefined;
  isLoading: boolean;
  lang: Lang;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, hours: number) => void;
  onAction: (action: PendingAction) => void;
  snoozedIds: string[];
}

const URGENCY_CONFIG = {
  critical: {
    border: 'border-l-destructive',
    bg: 'bg-destructive/5',
    badge: 'bg-destructive text-white',
    dot: 'bg-destructive',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  important: {
    border: 'border-l-warning',
    bg: 'bg-warning/5',
    badge: 'bg-warning text-warning-foreground',
    dot: 'bg-warning',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
  },
  info: {
    border: 'border-l-info',
    bg: 'bg-info/5',
    badge: 'bg-info/20 text-info',
    dot: 'bg-info',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
  },
};

function SnoozeMenu({ onSnooze, onClose }: { onSnooze: (h: number) => void; onClose: () => void }) {
  const options = [
    { label: '1 hour', hours: 1 },
    { label: '4 hours', hours: 4 },
    { label: '1 day', hours: 24 },
  ];
  return (
    <div className="absolute right-0 top-full z-dropdown mt-1 w-32 overflow-hidden rounded-lg border bg-popover shadow-lg animate-scale-in">
      {options.map((o) => (
        <button
          key={o.hours}
          onClick={() => { onSnooze(o.hours); onClose(); }}
          className="flex w-full items-center px-3 py-2 text-sm hover:bg-accent transition-colors"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ActionItem({
  action,
  lang,
  onDismiss,
  onSnooze,
  onAction,
}: {
  action: PendingAction;
  lang: Lang;
  onDismiss: (id: string) => void;
  onSnooze: (id: string, hours: number) => void;
  onAction: (a: PendingAction) => void;
}) {
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const cfg = URGENCY_CONFIG[action.urgency];

  return (
    <div
      className={cn(
        'group relative rounded-lg border border-l-4 p-4 transition-all hover:shadow-sm',
        cfg.border,
        cfg.bg
      )}
      role="listitem"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full', cfg.badge)}>
            {cfg.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{action.title}</p>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', cfg.badge)}>
                {action.urgency}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{action.description}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/70">{formatRelativeTime(action.createdAt)}</p>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => onDismiss(action.id)}
          className="ml-2 shrink-0 rounded-md p-1 text-muted-foreground/60 opacity-0 transition-all group-hover:opacity-100 hover:bg-background hover:text-foreground"
          aria-label="Dismiss"
          title={t('pending_dismiss', lang)}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => onAction(action)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
        >
          {action.actionLabel}
        </button>

        {/* Snooze */}
        <div className="relative">
          <button
            onClick={() => setSnoozeOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs text-muted-foreground transition-all hover:bg-accent"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('pending_snooze', lang)}
          </button>
          {snoozeOpen && (
            <SnoozeMenu
              onSnooze={(h) => onSnooze(action.id, h)}
              onClose={() => setSnoozeOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function PendingActionsModule({
  actions,
  isLoading,
  lang,
  onDismiss,
  onSnooze,
  onAction,
  snoozedIds,
}: PendingActionsModuleProps) {
  const sortOrder = { critical: 0, important: 1, info: 2 };
  const visibleActions = (actions ?? [])
    .filter((a) => !snoozedIds.includes(a.id))
    .sort((a, b) => sortOrder[a.urgency] - sortOrder[b.urgency]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{t('pending_title', lang)}</CardTitle>
          {!isLoading && visibleActions.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
              {visibleActions.length}
            </span>
          )}
        </div>
        <div className="flex gap-1.5 text-[10px] font-medium">
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
            {t('pending_critical', lang)}
          </span>
          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-warning">
            {t('pending_important', lang)}
          </span>
          <span className="rounded-full bg-info/10 px-2 py-0.5 text-info">
            {t('pending_info', lang)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))
        ) : visibleActions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10">
              <svg className="h-6 w-6 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-medium text-brand-green">{t('kpi_all_clear', lang)}</p>
            <p className="text-sm text-muted-foreground">No pending actions — you're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2" role="list" aria-label="Pending actions">
            {visibleActions.map((action) => (
              <ActionItem
                key={action.id}
                action={action}
                lang={lang}
                onDismiss={onDismiss}
                onSnooze={onSnooze}
                onAction={onAction}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
