import React from 'react'
import Link from 'next/link'
import Container from '../components/Container'

export default function NotFound() {
  return (
    <Container>
      <div className="flex min-h-[65vh] w-full flex-col items-center justify-center p-6 text-center">
        <div className="rounded-2xl border bg-card p-8 md:p-12 shadow-sm max-w-md w-full">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Page Not Found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            The page or fashion item you are looking for doesn&apos;t exist or may have been moved.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Back to Home
            </Link>
            <Link
              href="/search"
              className="w-full rounded-lg border bg-card px-4 py-2.5 text-sm font-semibold text-card-foreground transition-colors hover:bg-accent"
            >
              Search Marketplace
            </Link>
          </div>
        </div>
      </div>
    </Container>
  )
}
