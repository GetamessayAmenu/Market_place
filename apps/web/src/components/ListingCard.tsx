import React from 'react'
import Link from 'next/link'

export default function ListingCard({ title, price }: { title: string; price: number }) {
  return (
    <article className="border rounded-md p-4 bg-white">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">${price}</p>
      <div className="mt-4">
        <Link href="#" className="text-blue-600">
          View
        </Link>
      </div>
    </article>
  )
}
