import React from 'react'

import Container from '../../../../components/Container'
import MessageThread from '../../../../components/dashboard/MessageThread'
import { requireUser } from '../../../../lib/authServer'
import { serverGet } from '../../../../lib/serverApi'

interface Props {
  params: { id: string }
}

interface ConversationResponse {
  success: boolean
  data: { id: string; title?: string }
}

interface MessagesResponse {
  success: boolean
  data: { id: string; content: string }[]
}

export function generateMetadata({ params }: Props) {
  return { title: `Conversation ${params.id}` }
}

export default async function ConversationPage({ params }: Props) {
  await requireUser()
  const convRes = await serverGet<ConversationResponse>(`/conversations/${params.id}`)
  const msgsRes = await serverGet<MessagesResponse>(`/conversations/${params.id}/messages`)
  const conversation = convRes.data
  const messages = msgsRes.data

  return (
    <Container>
      <section className="py-8">
        <h2 className="text-2xl font-semibold">{conversation.title ?? 'Conversation'}</h2>
        <div className="mt-6">
          <MessageThread conversation={conversation} initialMessages={messages} />
        </div>
      </section>
    </Container>
  )
}
