import React from 'react'
import Link from 'next/link'

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-gray-100 p-4">
      <nav className="space-y-2">
        <Link href="/">Dashboard</Link>
        <Link href="/users">Users</Link>
        <Link href="/listings">Listings</Link>
        <Link href="/reports">Reports</Link>
        <Link href="/verification">Verification</Link>
        <Link href="/chat">Chat</Link>
        <Link href="/notifications">Notifications</Link>
        <Link href="/audit">Audit Logs</Link>
        <Link href="/analytics">Analytics</Link>
      </nav>
    </aside>
  )
}
