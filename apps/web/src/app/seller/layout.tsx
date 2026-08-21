import React from 'react'

import SellerSidebar from '../../components/seller/SellerSidebar'
import SellerHeader from '../../components/seller/SellerHeader'
import SellerBottomNav from '../../components/seller/SellerBottomNav'

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <SellerHeader />

      {/* Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Desktop) */}
        <SellerSidebar />

        {/* Main scrollable area */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto pb-20 lg:pb-0"
        >
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <SellerBottomNav />
    </div>
  )
}
