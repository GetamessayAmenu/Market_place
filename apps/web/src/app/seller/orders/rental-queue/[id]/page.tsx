'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SellerRentalOrderRedirectPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const id = (params?.id as string) || '';
    if (id) {
      router.replace(`/seller/orders/rental-queue?orderId=${encodeURIComponent(id)}`);
    } else {
      router.replace('/seller/orders/rental-queue');
    }
  }, [params, router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
