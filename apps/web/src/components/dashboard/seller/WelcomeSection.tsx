'use client';

import React from 'react';

import type { Lang } from '../../../lib/i18n';
import { t } from '../../../lib/i18n';

interface WelcomeSectionProps {
  displayName: string;
  hasListings: boolean;
  pendingActionsCount: number;
  lang: Lang;
}

function getGreeting(lang: Lang): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour <= 11) return t('greeting_morning', lang);
  if (hour >= 12 && hour <= 17) return t('greeting_afternoon', lang);
  return t('greeting_evening', lang);
}

const SetupStep = ({ done, label }: { done?: boolean; label: string }) => (
  <div className="flex items-center gap-3">
    <div
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        done
          ? 'border-brand-green bg-brand-green text-white'
          : 'border-muted-foreground/40 bg-background'
      }`}
    >
      {done && (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
    <span className={`text-sm ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
      {label}
    </span>
  </div>
);

export default function WelcomeSection({
  displayName,
  hasListings,
  pendingActionsCount,
  lang,
}: WelcomeSectionProps) {
  if (!hasListings) {
    return (
      <div className="rounded-2xl border border-brand-gold/20 bg-gradient-to-br from-brand-gold/5 via-background to-brand-terra/5 p-6 shadow-sm">
        {/* Onboarding empty state */}
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-2xl">👋</span>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {t('empty_no_listings_title', lang)}, {displayName}!
            </h1>
          </div>
          <p className="text-muted-foreground">{t('empty_no_listings_desc', lang)}</p>
        </div>

        {/* Setup checklist */}
        <div className="mb-6 rounded-xl border bg-card p-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Getting started checklist
          </p>
          <div className="space-y-2.5">
            <SetupStep label="Add at least 5 photos to your listing" />
            <SetupStep label="Write a detailed product description" />
            <SetupStep label="Set a competitive price in ETB" />
            <SetupStep label="Choose the right category" />
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3">
          <a
            href="/dashboard/seller/listings/create"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('empty_create_first', lang)}
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-5 py-2.5 text-sm font-semibold transition-all hover:bg-accent hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-2.75 4.83 4.83 0 00-4.65-3.5H8.41A4.83 4.83 0 004.18 3.94a4.83 4.83 0 01-3.77 2.75A4.83 4.83 0 000 11.56v.88a4.83 4.83 0 004.41 4.87 4.83 4.83 0 013.77 2.75 4.83 4.83 0 004.64 3.5h2.76a4.83 4.83 0 004.64-3.5 4.83 4.83 0 013.77-2.75A4.83 4.83 0 0024 12.44v-.88a4.83 4.83 0 00-4.41-4.87zM10 15V9l5 3-5 3z" />
            </svg>
            Watch quick tutorial (&lt;3 min)
          </a>
        </div>
      </div>
    );
  }

  const greeting = getGreeting(lang);
  const hasPending = pendingActionsCount > 0;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        {greeting}, {displayName} 👋
      </h1>
      <p className="mt-1 text-muted-foreground">
        {t('dashboard_subtitle', lang)}
      </p>
      {hasPending && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
          You have {pendingActionsCount} urgent action{pendingActionsCount !== 1 ? 's' : ''} requiring attention
        </div>
      )}
    </div>
  );
}
