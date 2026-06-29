'use client';

import React from 'react';

import type { Lang } from '../../../lib/i18n';
import { t } from '../../../lib/i18n';

interface OfflineBannerProps {
  isOnline: boolean;
  lang: Lang;
}

export default function OfflineBanner({ isOnline, lang }: OfflineBannerProps) {
  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm font-medium text-white shadow-lg animate-in slide-in-from-bottom"
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.163a1.996 1.996 0 01.141.002m-7.824-2.163l1.414-1.414M12 21v-3" />
      </svg>
      {t('offline_banner', lang)}
    </div>
  );
}
