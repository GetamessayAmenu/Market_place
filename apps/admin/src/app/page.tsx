import React from 'react'
import { serverGet } from '../lib/serverApi'
import { requireAdmin } from '../lib/authServer'
import Container from '../components/Container'

export default async function Page() {
  await requireAdmin()

  // Try to fetch a few counts from the API; fall back to zeros on error
  let stats = { users: 0, sellers: 0, listings: 0, reports: 0 }
  try {
    const res = await serverGet('/admin/stats')
    stats = res.data || stats
  } catch (e) {
    // best effort: try public endpoints
    try {
      const u = await serverGet('/users?page=1&limit=1')
      stats.users = u?.meta?.total || 0
    } catch {}
  }

  return (
    <Container>
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded shadow">Users<br/><strong>{stats.users}</strong></div>
        <div className="p-4 bg-white rounded shadow">Sellers<br/><strong>{stats.sellers}</strong></div>
        <div className="p-4 bg-white rounded shadow">Listings<br/><strong>{stats.listings}</strong></div>
        <div className="p-4 bg-white rounded shadow">Reports<br/><strong>{stats.reports}</strong></div>
      </div>
    </Container>
  )
}
