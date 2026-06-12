import React from 'react'
import Link from 'next/link'
import Container from '../components/Container'

export default function HomePage() {
  return (
    <Container>
      <section className="py-12">
        <h1 className="text-3xl font-bold">Welcome to Marketplace</h1>
        <p className="mt-4 text-muted-foreground">Find great local deals.</p>
        <div className="mt-6">
          <Link href="/search" className="text-blue-600 underline">
            Browse listings
          </Link>
        </div>
      </section>
    </Container>
  )
}
