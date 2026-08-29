import React from 'react'
import { cookies } from 'next/headers'

import Container from '../../../components/Container'
import NotificationsClient, { type NotificationItem } from '../../../components/dashboard/NotificationsClient'
import { requireUser } from '../../../lib/authServer'
import { serverGet } from '../../../lib/serverApi'

export default async function NotificationsPage() {
  await requireUser()
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const res = await serverGet<NotificationItem[] | { items: NotificationItem[] }>('/notifications', { cookieHeader }).catch(() => [])
  const initialNotifications = Array.isArray(res) ? res : res?.items ?? []

  return (
    <Container>
      <section className="py-8">
        <h2 className="text-2xl font-semibold">Notifications</h2>
        <div className="mt-6">
          <NotificationsClient initialNotifications={initialNotifications} />
        </div>
      </section>
    </Container>
  )
}
