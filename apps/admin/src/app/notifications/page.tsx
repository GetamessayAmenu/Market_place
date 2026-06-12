import React from 'react'
import { requireAdmin } from '../../lib/authServer'
import Container from '../../components/Container'

export default async function NotificationsPage() {
  await requireAdmin()
  return (
    <Container>
      <h2 className="text-xl font-semibold mb-4">Notifications</h2>
      <div className="bg-white rounded shadow p-4">Under construction</div>
    </Container>
  )
}
