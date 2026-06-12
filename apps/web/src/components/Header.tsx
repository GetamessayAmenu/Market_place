"use client"
import React from 'react'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold">
          Marketplace
        </Link>
        <nav>
          <Link href="/search" className="mr-4">
            Browse
          </Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </div>
    </header>
  )
}
