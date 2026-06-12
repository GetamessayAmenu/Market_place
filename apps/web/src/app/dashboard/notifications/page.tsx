import React from 'react'
import { requireUser } from '../../../lib/authServer'
import { serverGet } from '../../../lib/serverApi'
import Container from '../../../components/Container'
import NotificationsClient from '../../../components/dashboard/NotificationsClient'

export default async function NotificationsPage() {
  await requireUser()
  const res = await serverGet('/notifications')
  const notifications = res.data || []

  return (
    <Container>
      <section className="py-8">
        <h2 className="text-2xl font-semibold">Notifications</h2>
        <div className="mt-6">
          <NotificationsClient initialNotifications={notifications} />
        </div>
      </section>
    </Container>
  )
}
