import React from 'react'

import { requireAdmin } from '../../lib/authServer'
import { serverGet } from '../../lib/serverApi'

interface UserRow {
  id: string
  name?: string
  email?: string
  roles?: string[]
  createdAt?: string
}

interface UsersResponse {
  success: boolean
  data: UserRow[]
  meta?: { total: number; page: number; limit: number; totalPages: number }
}

export default async function UsersPage() {
  await requireAdmin()
  let users: UserRow[] = []
  let total = 0
  try {
    const res = await serverGet<UsersResponse>('/users?page=1&limit=20')
    users = res.data
    total = res.meta?.total ?? 0
  } catch {
    users = []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">{total > 0 ? `${String(total)} total users` : 'Manage marketplace users'}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No users found or API unavailable.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{u.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium">{u.name ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {u.roles?.[0] ?? 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
