import React from 'react'
import { requireUser } from '../../../lib/authServer'
import { serverGet } from '../../../lib/serverApi'
import Container from '../../../components/Container'
import ListingCard from '../../../components/ListingCard'

export default async function SavedListingsPage() {
  const user = await requireUser()
  const res = await serverGet(`/favorites`)
  const items = res.data || []

  return (
    <Container>
      <section className="py-8">
        <h2 className="text-2xl font-semibold">Saved Listings</h2>
        <p className="mt-2 text-sm text-gray-600">Saved items for {user?.name}</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 && <div className="text-gray-600">No saved listings.</div>}
          {items.map((fav: any) => (
            <ListingCard key={fav.listing.id} title={fav.listing.title} price={fav.listing.price} />
          ))}
        </div>
      </section>
    </Container>
  )
}
