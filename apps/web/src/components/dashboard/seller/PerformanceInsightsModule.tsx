'use client';

import { Card, CardContent, CardHeader, CardTitle, Skeleton, cn } from '@marketplace/ui';
import React from 'react';

import type { PerformanceInsights } from '../../../lib/dashboardApi';
import type { Lang } from '../../../lib/i18n';
import { t } from '../../../lib/i18n';

interface PerformanceInsightsModuleProps {
  insights: PerformanceInsights | undefined;
  isLoading: boolean;
  lang: Lang;
}

function GaugeChart({ score }: { score: number }) {
  const isGood = score >= 80;
  const isMed = score >= 60 && score < 80;
  const color = isGood ? 'text-brand-green' : isMed ? 'text-warning' : 'text-destructive';
  const strokeColor = isGood ? 'stroke-brand-green' : isMed ? 'stroke-warning' : 'stroke-destructive';
  
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
        <circle
          className="stroke-muted"
          strokeWidth="8"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        <circle
          className={cn('transition-all duration-1000 ease-out', strokeColor)}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={cn('text-2xl font-bold', color)}>{score}</span>
        <span className="text-[9px] font-medium uppercase text-muted-foreground">Score</span>
      </div>
    </div>
  );
}

export default function PerformanceInsightsModule({
  insights,
  isLoading,
  lang,
}: PerformanceInsightsModuleProps) {
  if (!isLoading && !insights) return null;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-brand-gold/5 via-background to-brand-terra/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('perf_title', lang)}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading || !insights ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top section: Gauge & Summary */}
              <div className="flex items-center gap-6">
                <GaugeChart score={insights.healthScore} />
                <div className="flex-1 space-y-1.5">
                  <h3 className="font-semibold text-foreground">
                    {t('perf_health_score', lang)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Based on Listing Quality (40%), Response Time (30%), and Fulfillment (30%).
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-gold/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-gold">
                    🏆 {t('perf_peer_comparison', lang)}: Top {100 - insights.peerPercentile}%
                  </div>
                </div>
              </div>

              {/* Breakdown Bars */}
              <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
                <div>
                  <div className="mb-1 flex justify-between text-xs font-medium text-muted-foreground">
                    <span>{t('perf_listing_quality', lang)}</span>
                    <span className="text-foreground">{insights.listingQualityScore}/100</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-brand-terra transition-all" style={{ width: `${insights.listingQualityScore}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs font-medium text-muted-foreground">
                    <span>{t('perf_response_time', lang)}</span>
                    <span className="text-foreground">{insights.responseTimeScore}/100</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-info transition-all" style={{ width: `${insights.responseTimeScore}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs font-medium text-muted-foreground">
                    <span>{t('perf_fulfillment_rate', lang)}</span>
                    <span className="text-foreground">{insights.fulfillmentRateScore}/100</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-brand-green transition-all" style={{ width: `${insights.fulfillmentRateScore}%` }} />
                  </div>
                </div>
              </div>

              {/* Contextual Tips */}
              {insights.tips.length > 0 && (
                <div className="space-y-2 pt-2" role="list" aria-label="Performance tips">
                  {insights.tips.sort((a, b) => a.priority - b.priority).map((tip) => (
                    <div key={tip.id} className="flex items-start gap-3 rounded-lg border bg-accent/30 p-3" role="listitem">
                      <div className="mt-0.5 text-base">💡</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{tip.message}</p>
                        <p className="mt-0.5 text-xs font-semibold text-brand-green">{tip.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
