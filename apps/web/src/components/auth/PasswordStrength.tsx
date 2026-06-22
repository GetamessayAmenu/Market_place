"use client"
import { cn } from '@marketplace/ui';
import React, { useMemo } from 'react';

export interface PasswordStrengthProps {
  password: string | undefined;
  className?: string;
}

interface Criteria {
  label: string;
  met: boolean;
}

type StrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

const strengthConfig: Record<StrengthLevel, { label: string; color: string; width: string; score: number }> = {
  empty: { label: '', color: 'bg-muted', width: '0%', score: 0 },
  weak: { label: 'Weak', color: 'bg-destructive', width: '25%', score: 1 },
  fair: { label: 'Fair', color: 'bg-yellow-500', width: '50%', score: 2 },
  good: { label: 'Good', color: 'bg-brand-gold', width: '75%', score: 3 },
  strong: { label: 'Strong', color: 'bg-brand-green', width: '100%', score: 4 },
};

function evaluateCriteria(password: string): Criteria[] {
  return [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

function getStrength(criteria: Criteria[]): StrengthLevel {
  const met = criteria.filter((c) => c.met).length;
  if (met === 0) return 'empty';
  if (met === 1) return 'weak';
  if (met === 2) return 'fair';
  if (met === 3) return 'good';
  return 'strong';
}

export default function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const safePassword = password ?? '';
  const criteria = useMemo(() => evaluateCriteria(safePassword), [safePassword]);
  const strength = getStrength(criteria);
  const config = strengthConfig[strength];

  if (safePassword.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)} aria-live="polite" aria-atomic="true">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={config.score} aria-valuemin={0} aria-valuemax={4} aria-label={`Password strength: ${config.label}`}>
          <div
            className={cn('h-full rounded-full transition-all duration-300', config.color)}
            style={{ width: config.width }}
          />
        </div>
        {strength !== 'empty' && (
          <p className={cn(
            'text-xs font-medium',
            strength === 'weak' && 'text-destructive',
            strength === 'fair' && 'text-yellow-600',
            strength === 'good' && 'text-brand-gold',
            strength === 'strong' && 'text-brand-green'
          )}>
            {config.label}
          </p>
        )}
      </div>

      {/* Criteria checklist */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {criteria.map((c) => (
          <span
            key={c.label}
            className={cn(
              'flex items-center gap-1 text-xs transition-colors',
              c.met ? 'text-brand-green' : 'text-muted-foreground'
            )}
          >
            {c.met ? (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
