import React from 'react'
import Container from '../../../components/Container'
import { serverGet } from '../../../lib/serverApi'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props) {
  try {
    const res = await serverGet(`/listings/${params.id}`, { revalidate: 60 })
    const listing = res.data
    return {
      title: listing.title,
      description: listing.description?.slice(0, 160) || '',
      openGraph: {
        title: listing.title,
        description: listing.description?.slice(0, 160) || '',
        images: listing.primaryImageUrl ? [listing.primaryImageUrl] : undefined,
      },
      alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/listings/${listing.id}` },
    }
  } catch (e) {
    return { title: `Listing ${params.id}` }
  }
}

export default async function ListingPage({ params }: Props) {
  const { id } = params
  const res = await serverGet(`/listings/${id}`, { revalidate: 60 })
  const listing = res.data

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description,
    image: listing.primaryImageUrl ? [listing.primaryImageUrl] : undefined,
    url: `${siteUrl}/listings/${listing.id}`,
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'USD',
      availability: listing.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <Container>
      <section className="py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{listing.title}</h1>
        </div>
        <div className="mt-6">{listing.description}</div>
        <div className="mt-4 text-sm text-gray-600">Price: ${listing.price}</div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </section>
    </Container>
  )
}
