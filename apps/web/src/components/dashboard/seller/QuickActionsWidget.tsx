'use client';

import { Card, CardContent, CardHeader, CardTitle, cn } from '@marketplace/ui';
import React, { useState } from 'react';

import type { Lang } from '../../../lib/i18n';
import { t } from '../../../lib/i18n';

interface QuickActionsWidgetProps {
  pinnedActions: string[];
  lang: Lang;
  onCustomize: (actions: string[]) => void;
}

const ALL_ACTIONS = [
  { id: 'view_orders', label: 'qa_view_orders', icon: '📦', url: '/dashboard/seller/orders' },
  { id: 'view_analytics', label: 'qa_view_analytics', icon: '📊', url: '/dashboard/seller/analytics' },
  { id: 'seller_settings', label: 'qa_seller_settings', icon: '⚙️', url: '/dashboard/seller/settings' },
  { id: 'promote_listings', label: 'qa_promote_listings', icon: '🚀', url: '/dashboard/seller/promote' },
  { id: 'view_reviews', label: 'qa_view_reviews', icon: '⭐', url: '/dashboard/seller/reviews' },
  { id: 'download_reports', label: 'qa_download_reports', icon: '📥', url: '/dashboard/seller/reports' },
] as const;

export default function QuickActionsWidget({ pinnedActions, lang, onCustomize }: QuickActionsWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localPinned, setLocalPinned] = useState(pinnedActions);

  const togglePin = (id: string) => {
    if (localPinned.includes(id)) {
      setLocalPinned((prev) => prev.filter((a) => a !== id));
    } else {
      if (localPinned.length < 4) {
        setLocalPinned((prev) => [...prev, id]);
      }
    }
  };

  const handleSave = () => {
    onCustomize(localPinned);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="text-xs font-medium text-primary hover:underline"
        >
          {isEditing ? 'Save' : t('qa_customize', lang)}
        </button>
      </CardHeader>
      <CardContent>
        {/* Primary Actions */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <a
            href="/dashboard/seller/listings/create"
            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-primary px-4 py-6 text-primary-foreground shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="font-semibold text-center">{t('qa_new_listing', lang)}</span>
          </a>
          <a
            href="/dashboard/seller/listings"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-6 text-primary shadow-sm transition-all hover:bg-primary/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <span className="font-semibold text-center">{t('qa_manage_inventory', lang)}</span>
          </a>
        </div>

        {/* Secondary Pinned Actions */}
        {isEditing ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Select up to 4 quick actions to pin to your dashboard.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ALL_ACTIONS.map((action) => {
                const isPinned = localPinned.includes(action.id);
                const isDisabled = !isPinned && localPinned.length >= 4;
                return (
                  <button
                    key={action.id}
                    onClick={() => togglePin(action.id)}
                    disabled={isDisabled}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-all',
                      isPinned ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent',
                      isDisabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className="text-base">{action.icon}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{t(action.label as any, lang)}</span>
                    {isPinned && (
                      <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {pinnedActions.map((id) => {
              const action = ALL_ACTIONS.find((a) => a.id === id);
              if (!action) return null;
              return (
                <a
                  key={action.id}
                  href={action.url}
                  className="flex items-center gap-2 rounded-lg border p-2 text-xs transition-all hover:border-primary/30 hover:bg-accent/50 hover:shadow-sm"
                >
                  <span className="text-base">{action.icon}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">{t(action.label as any, lang)}</span>
                </a>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
