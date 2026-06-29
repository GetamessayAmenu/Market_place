'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton, cn } from '@marketplace/ui';
import React, { useState } from 'react';

import type { RecentOrder } from '../../../lib/dashboardApi';
import { formatETB, formatRelativeTime } from '../../../lib/formatters';
import type { Lang } from '../../../lib/i18n';
import { t } from '../../../lib/i18n';

interface RecentOrdersSectionProps {
  orders: RecentOrder[] | undefined;
  isLoading: boolean;
  lang: Lang;
  onMessageCustomer: (order: RecentOrder) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info'; color: string }> = {
  new: { label: 'New', variant: 'info', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
  confirmed: { label: 'Confirmed', variant: 'success', color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' },
  shipped: { label: 'Shipped', variant: 'default', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' },
  delivered: { label: 'Delivered', variant: 'default', color: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400' },
  completed: { label: 'Completed', variant: 'success', color: 'text-brand-gold bg-brand-gold/10' },
  cancelled: { label: 'Cancelled', variant: 'error', color: 'text-destructive bg-destructive/10' },
};

const TYPE_CONFIG = {
  sale: { label: 'Sale', icon: '🛍️', color: 'text-blue-600' },
  rent: { label: 'Rent', icon: '🔄', color: 'text-purple-600' },
  custom: { label: 'Custom', icon: '✂️', color: 'text-brand-terra' },
};

const NEXT_STATUS: Record<string, string[]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['shipped'],
  shipped: ['delivered'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
};

function OrderStatusDropdown({ order, onUpdate }: { order: RecentOrder; onUpdate: (orderId: string, status: string) => void }) {
  const [open, setOpen] = useState(false);
  const nextStatuses = NEXT_STATUS[order.status] ?? [];
  if (nextStatuses.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all hover:bg-accent"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {t('orders_update_status', 'en')}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-dropdown mt-1 min-w-32 overflow-hidden rounded-lg border bg-popover shadow-lg animate-scale-in">
          {nextStatuses.map((s) => (
            <button
              key={s}
              onClick={() => { onUpdate(order.id, s); setOpen(false); }}
              className="flex w-full items-center px-3 py-2 text-sm capitalize hover:bg-accent transition-colors"
            >
              {STATUS_CONFIG[s]?.label ?? s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecentOrdersSection({
  orders,
  isLoading,
  lang,
  onMessageCustomer,
  onUpdateStatus,
}: RecentOrdersSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">{t('orders_title', lang)}</CardTitle>
        <a
          href="/dashboard/seller/orders"
          className="text-xs font-medium text-primary hover:underline transition-colors"
        >
          {t('orders_view_all', lang)} →
        </a>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <p className="font-medium">{t('empty_no_orders_title', lang)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('empty_no_orders_desc', lang)}</p>
          </div>
        ) : (
          <div className="space-y-2.5" role="list" aria-label="Recent orders">
            {orders.map((order) => {
              const statusCfg = STATUS_CONFIG[order.status];
              const typeCfg = TYPE_CONFIG[order.type];
              return (
                <div
                  key={order.id}
                  className="group rounded-xl border p-4 transition-all hover:border-primary/20 hover:shadow-sm"
                  role="listitem"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Type icon */}
                        <span className="text-base" title={typeCfg?.label ?? order.type} aria-label={typeCfg?.label}>
                          {typeCfg?.icon ?? '📦'}
                        </span>
                        <p className="truncate text-sm font-semibold">{order.itemTitle}</p>
                        {/* Status badge */}
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', statusCfg?.color)}>
                          {statusCfg?.label ?? order.status}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{order.customerName}</span>
                        <span>·</span>
                        <span>{order.customerCity}</span>
                        <span>·</span>
                        <span className="font-medium text-foreground">{formatETB(order.value)}</span>
                        <span>·</span>
                        <span>{formatRelativeTime(order.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/60">#{order.orderNumber}</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a
                      href={`/dashboard/seller/orders/${order.id}`}
                      className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium transition-all hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
                    >
                      {t('orders_view_details', lang)}
                    </a>
                    <button
                      onClick={() => onMessageCustomer(order)}
                      className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all hover:bg-accent active:scale-[0.98]"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {t('orders_message_customer', lang)}
                    </button>
                    <OrderStatusDropdown order={order} onUpdate={onUpdateStatus} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
