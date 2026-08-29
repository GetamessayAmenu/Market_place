"use client"
import React from 'react'
import Link from 'next/link'
import {
  FileCheck,
  Users,
  ShieldAlert,
  FolderTree,
  Send,
  Layout,
  FileText,
  ShoppingBag,
  Zap,
} from 'lucide-react'

export default function QuickActionsGrid() {
  const actions = [
    {
      title: 'Review Listings',
      description: 'Moderate pending marketplace items',
      href: '/listings?status=pending_review',
      icon: <FileCheck className="h-5 w-5 text-amber-500" />,
      accent: 'hover:border-amber-500/50 hover:bg-amber-500/5',
    },
    {
      title: 'Manage Users & KYC',
      description: 'Review seller applications & status',
      href: '/admin/users-verification',
      icon: <Users className="h-5 w-5 text-blue-500" />,
      accent: 'hover:border-blue-500/50 hover:bg-blue-500/5',
    },
    {
      title: 'Moderation Reports',
      description: 'Resolve user & listing reports',
      href: '/admin/moderation-reports',
      icon: <ShieldAlert className="h-5 w-5 text-rose-500" />,
      accent: 'hover:border-rose-500/50 hover:bg-rose-500/5',
    },
    {
      title: 'Taxonomies & Categories',
      description: 'Manage clothing categories & tags',
      href: '/admin/taxonomies',
      icon: <FolderTree className="h-5 w-5 text-purple-500" />,
      accent: 'hover:border-purple-500/50 hover:bg-purple-500/5',
    },
    {
      title: 'Send Broadcast',
      description: 'Dispatch push/in-app announcements',
      href: '/admin/notifications-broadcasts',
      icon: <Send className="h-5 w-5 text-emerald-500" />,
      accent: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
    },
    {
      title: 'Homepage CMS',
      description: 'Update banners, hero & featured section',
      href: '/admin/homepage-content',
      icon: <Layout className="h-5 w-5 text-sky-500" />,
      accent: 'hover:border-sky-500/50 hover:bg-sky-500/5',
    },
    {
      title: 'Audit Logs',
      description: 'Inspect admin system operations',
      href: '/admin/audit-logs',
      icon: <FileText className="h-5 w-5 text-indigo-500" />,
      accent: 'hover:border-indigo-500/50 hover:bg-indigo-500/5',
    },
    {
      title: 'Orders & Transactions',
      description: 'Track orders, rentals & custom tailoring',
      href: '/listings',
      icon: <ShoppingBag className="h-5 w-5 text-teal-500" />,
      accent: 'hover:border-teal-500/50 hover:bg-teal-500/5',
    },
  ]

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border pb-4 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Quick Admin Operations</h2>
          <p className="text-xs text-muted-foreground">Shortcuts to core marketplace management modules</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {actions.map((act) => (
          <Link
            key={act.title}
            href={act.href}
            className={`flex flex-col justify-between rounded-2xl border border-border bg-background p-4 transition ${act.accent} group`}
          >
            <div>
              <div className="mb-2">{act.icon}</div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition">
                {act.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                {act.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
