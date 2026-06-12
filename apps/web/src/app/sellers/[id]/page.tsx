import React from 'react'
import Container from '../../../components/Container'
import { serverGet } from '../../../lib/serverApi'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props) {
  try {
    const res = await serverGet(`/users/${params.id}`, { revalidate: 120 })
    const u = res.data
    return { title: `${u.name || 'Seller'} — Profile`, description: u.bio?.slice(0, 160) }
  } catch (e) {
    return { title: `Seller: ${params.id}` }
  }
}

export default async function SellerPage({ params }: Props) {
  const { id } = params
  const res = await serverGet(`/users/${id}`, { revalidate: 120 })
  const user = res.data

  return (
    <Container>
      <section className="py-8">
        <h1 className="text-2xl font-bold">{user.name || `Seller ${id}`}</h1>
        <div className="mt-4">{user.bio}</div>
        <div className="mt-6">Seller listings placeholder</div>
      </section>
    </Container>
  )
}
