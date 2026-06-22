import { cn } from '@marketplace/ui';
import React from 'react';

export interface MiniBarChartData {
  label: string;
  value: number;
}

export interface MiniBarChartProps {
  data: MiniBarChartData[];
  height?: number;
  color?: string;
  className?: string;
}

export default function MiniBarChart({ data, height = 128, color = 'bg-brand-gold', className }: MiniBarChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value));
  if (maxValue === 0) return null;

  return (
    <div className={cn('w-full', className)} role="img" aria-label={`Bar chart with ${String(data.length)} data points`}>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((bar, i) => {
          const percent = (bar.value / maxValue) * 100;
          return (
            <div
              key={i}
              className={cn('flex-1 rounded-t transition-all duration-200 hover:opacity-80', color)}
              style={{ height: `${String(Math.max(percent, 2))}%` }}
              title={`${bar.label}: ${String(bar.value)}`}
              role="presentation"
            />
          );
        })}
      </div>
    </div>
  );
}
