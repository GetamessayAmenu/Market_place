"use client"
import React, { useState } from 'react'
import Container from '../../components/Container'
import ListingCard from '../../components/ListingCard'
import { useListings } from '../../hooks/useListings'

export default function SearchPage() {
  const [q, setQ] = useState('')
  const { data, isLoading, error } = useListings({ q })

  return (
    <Container>
      <section className="py-8">
        <h2 className="text-2xl font-semibold">Search Results</h2>
        <div className="mt-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search listings"
            className="w-full max-w-md px-3 py-2 border rounded"
          />
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && <div>Loading...</div>}
          {error && <div className="text-red-600">Error loading results</div>}
          {data?.data?.map((item: any) => (
            <ListingCard key={item.id} title={item.title} price={item.price} />
          ))}
        </div>
      </section>
    </Container>
  )
}
