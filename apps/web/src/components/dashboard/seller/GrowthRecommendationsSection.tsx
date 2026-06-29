'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@marketplace/ui';
import React, { useState } from 'react';

import type { GrowthRecommendation } from '../../../lib/dashboardApi';
import type { Lang } from '../../../lib/i18n';
import { t } from '../../../lib/i18n';

interface GrowthRecommendationsSectionProps {
  recommendations: GrowthRecommendation[] | undefined;
  isLoading: boolean;
  lang: Lang;
  onDismiss: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  pricing: '💰',
  cross_sell: '🛒',
  listing_quality: '✨',
  timing: '⏰',
  category: '📂',
};

function RecommendationCard({
  rec,
  lang,
  onDismiss,
}: {
  rec: GrowthRecommendation;
  lang: Lang;
  onDismiss: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group relative rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="mt-0.5 text-lg" aria-hidden="true">
          {CATEGORY_ICONS[rec.category] ?? '💡'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{rec.title}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-brand-green/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-green">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {rec.impact}
            </span>
          </div>

          {expanded && (
            <div className="mt-3 animate-fade-in text-sm text-muted-foreground">
              {rec.description}
            </div>
          )}

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {expanded ? 'Show less' : 'View Details'}
            </button>
            <button
              onClick={() => onDismiss(rec.id)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              {t('dismiss', lang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GrowthRecommendationsSection({
  recommendations,
  isLoading,
  lang,
  onDismiss,
}: GrowthRecommendationsSectionProps) {
  if (!isLoading && (!recommendations || recommendations.length === 0)) return null;

  return (
    <Card className="border-brand-gold/20 bg-gradient-to-br from-brand-gold/5 via-background to-background">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span aria-hidden="true">📈</span> Sales Growth Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3" role="list">
            {(recommendations ?? []).slice(0, 5).map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                lang={lang}
                onDismiss={onDismiss}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
