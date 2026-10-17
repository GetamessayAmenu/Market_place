'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@marketplace/ui';

export default function DashboardNewListingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/seller/catalog/new');
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Redirecting to seller listing creation...</p>
      </div>
    </div>
  );
}
