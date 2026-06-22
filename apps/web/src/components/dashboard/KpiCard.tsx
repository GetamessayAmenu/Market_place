import { Card, CardContent, cn } from '@marketplace/ui';
import React from 'react';

export interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
  className?: string;
}

const trendColors: Record<string, string> = {
  up: 'text-brand-green',
  down: 'text-destructive',
  neutral: 'text-muted-foreground',
};

export default function KpiCard({ label, value, trend, trendDirection = 'neutral', icon, color, className }: KpiCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </div>
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', color)}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span className={cn('flex items-center gap-0.5 font-medium', trendColors[trendDirection])}>
              {trendDirection === 'up' && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
              )}
              {trendDirection === 'down' && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
