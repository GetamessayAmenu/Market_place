'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@marketplace/ui';
import React, { useEffect, useState } from 'react';

import { getUpcomingEthiopianEvents } from '../../../lib/ethiopianCalendar';
import type { Lang } from '../../../lib/i18n';
import { t } from '../../../lib/i18n';

interface SeasonalSuggestionsSectionProps {
  lang: Lang;
  onDismiss: (id: string) => void;
  dismissedIds: string[];
}

export default function SeasonalSuggestionsSection({
  lang,
  onDismiss,
  dismissedIds,
}: SeasonalSuggestionsSectionProps) {
  const [events, setEvents] = useState<{ id: string; name: string; date: Date; daysAway: number; suggestion: string }[]>([]);

  useEffect(() => {
    // Client-side only to avoid hydration mismatch with dates
    const upcoming = getUpcomingEthiopianEvents();
    setEvents(upcoming.filter((e) => !dismissedIds.includes(e.id)));
  }, [dismissedIds]);

  if (events.length === 0) return null;

  return (
    <Card className="border-brand-wine/20 bg-gradient-to-br from-brand-wine/5 via-background to-background">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span aria-hidden="true">📅</span> Seasonal Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3" role="list">
          {events.slice(0, 2).map((event) => (
            <div key={event.id} className="group relative rounded-xl border bg-card p-4 transition-all hover:border-brand-wine/30 hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{event.name}</p>
                    <span className="inline-flex rounded-full bg-brand-wine/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-wine">
                      In {event.daysAway} days
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    💡 Suggestion: <span className="font-normal text-muted-foreground">{event.suggestion}</span>
                  </p>
                  
                  <div className="mt-3 flex items-center gap-3">
                    <a
                      href={`/dashboard/seller/listings/create?campaign=${event.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Create listing
                    </a>
                    <button
                      onClick={() => onDismiss(event.id)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {t('dismiss', lang)}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
