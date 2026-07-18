"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const routeLabels: Record<string, string> = {
  analytics: 'Analytics',
  audit: 'Audit Logs',
  chat: 'Chat Monitor',
  listings: 'Listings',
  notifications: 'Notifications',
  reports: 'Reports',
  users: 'Users',
  verification: 'Verification',
}

export default function AdminBreadcrumbs() {
  const pathname = usePathname()
  const pathSegments = pathname.split('/').filter(Boolean)

  const breadcrumbs = [{ label: 'Dashboard', href: '/' }, ...pathSegments.map((segment, index) => ({
    label: routeLabels[segment] ?? segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    href: '/' + pathSegments.slice(0, index + 1).join('/'),
  }))]

  return (
    <nav className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1
        return (
          <span key={crumb.href} className="inline-flex items-center gap-2">
            {index > 0 && (
              <svg className="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            )}
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="transition-colors hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
