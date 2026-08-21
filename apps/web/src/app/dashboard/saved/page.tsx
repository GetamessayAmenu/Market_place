import React from 'react'
import { cookies } from 'next/headers'

import Container from '../../../components/Container'
import ListingCard from '../../../components/ListingCard'
import { requireUser } from '../../../lib/authServer'
import { serverGet } from '../../../lib/serverApi'

interface FavoriteItem {
  listing: {
    id: string
    title: string
    price: number
  }
}

export default async function SavedListingsPage() {
  const user = await requireUser()
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const items = await serverGet<FavoriteItem[]>('/favorites', { cookieHeader })

  const itemsArray = Array.isArray(items) ? items : []

  return (
    <Container>
      <section className="py-8">
        <h2 className="text-2xl font-semibold">Saved Listings</h2>
        <p className="mt-2 text-sm text-gray-600">Saved items for {user?.displayName}</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {itemsArray.length === 0 && <div className="text-gray-600">No saved listings.</div>}
          {itemsArray.map((fav) => (
            <ListingCard key={fav.listing.id} title={fav.listing.title} price={fav.listing.price} />
          ))}
        </div>
      </section>
    </Container>
  )
}
