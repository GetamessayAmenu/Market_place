'use client'

import { usePathname } from 'next/navigation'
import React from 'react'

import AdminShell from './admin/AdminShell'

const AUTH_EXCLUDED_PATHS = ['/login', '/admin/forbidden']

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = AUTH_EXCLUDED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/'),
  )

  if (isAuthRoute) {
    return <>{children}</>
  }

  return <AdminShell>{children}</AdminShell>
}
