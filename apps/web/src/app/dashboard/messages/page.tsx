import React from 'react'

import Container from '../../../components/Container'
import MessagesClient from '../../../components/dashboard/MessagesClient'
import { requireUser } from '../../../lib/authServer'
import { serverGet } from '../../../lib/serverApi'

interface ConversationResponse {
  success: boolean
  data: { id: string; title?: string }[]
}

export default async function MessagesPage() {
  await requireUser()
  const res = await serverGet<ConversationResponse>('/conversations')
  const conversations = res.data

  return (
    <Container>
      <section className="py-8">
        <h2 className="text-2xl font-semibold">Messages</h2>
        <div className="mt-6">
          <MessagesClient initialConversations={conversations} />
        </div>
      </section>
    </Container>
  )
}
