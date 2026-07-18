"use client"

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'

import AdminHeader from '../../components/AdminHeader'
import AdminSidebar from '../../components/AdminSidebar'

interface AdminShellProps {
  children: React.ReactNode
}

const AUTH_EXCLUDED_PATHS = ['/login', '/admin/forbidden']

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAuthRoute = AUTH_EXCLUDED_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'))

  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-muted text-foreground">
        <main className="min-h-screen px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-background text-foreground">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader onMobileMenuToggle={() => setMobileOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
          <div className="admin-container flex flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
