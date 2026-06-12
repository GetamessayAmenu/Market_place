import React from 'react'
import { requireUser } from '../../../../lib/authServer'
import { serverGet } from '../../../../lib/serverApi'
import Container from '../../../../components/Container'
import MessageThread from '../../../../components/dashboard/MessageThread'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props) {
  return { title: `Conversation ${params.id}` }
}

export default async function ConversationPage({ params }: Props) {
  await requireUser()
  const convRes = await serverGet(`/conversations/${params.id}`)
  const msgsRes = await serverGet(`/conversations/${params.id}/messages`)
  const conversation = convRes.data
  const messages = msgsRes.data || []

  return (
    <Container>
      <section className="py-8">
        <h2 className="text-2xl font-semibold">{conversation.title || 'Conversation'}</h2>
        <div className="mt-6">
          <MessageThread conversation={conversation} initialMessages={messages} />
        </div>
      </section>
    </Container>
  )
}
