'use client'

import React, { Suspense } from 'react'
import SellerRentalQueue from '../../../../components/seller/SellerRentalQueue'

export default function SellerRentalQueuePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading rental queue...</div>}>
      <SellerRentalQueue />
    </Suspense>
  )
}
