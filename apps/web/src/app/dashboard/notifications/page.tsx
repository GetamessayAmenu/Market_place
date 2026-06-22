import React from 'react'

import Container from '../../../components/Container'
import NotificationsClient from '../../../components/dashboard/NotificationsClient'
import { requireUser } from '../../../lib/authServer'
import { serverGet } from '../../../lib/serverApi'

export default async function NotificationsPage() {
  await requireUser()
  const notifications = await serverGet<{ id: string; type: string; title: string; body: string }[]>('/notifications')

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
