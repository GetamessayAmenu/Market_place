'use client';


import React from 'react';

import type { SocketStatus } from '../../../hooks/useRealtimeUpdates';
import type { Lang } from '../../../lib/i18n';
import { t } from '../../../lib/i18n';

interface ConnectionStatusIndicatorProps {
  status: SocketStatus;
  lang: Lang;
}

export default function ConnectionStatusIndicator({ status, lang }: ConnectionStatusIndicatorProps) {
  if (status === 'connected') return null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-warning">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
      </span>
      {status === 'reconnecting' ? t('live_paused', lang) : 'Disconnected'}
    </div>
  );
}
