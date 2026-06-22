"use client"
import { Button, cn } from '@marketplace/ui'
import React, { useState } from 'react'

export interface NewsletterFormProps {
  className?: string
}

export default function NewsletterForm({ className }: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!email) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className={cn('text-center', className)}>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-foreground">You are subscribed!</p>
        <p className="mt-1 text-sm text-muted-foreground">We will send you the latest fashion updates.</p>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className={cn('flex flex-col sm:flex-row gap-3 max-w-md mx-auto', className)}>
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => { setEmail(e.target.value) }}
        placeholder="Enter your email"
        className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
      />
      <Button type="submit" className="bg-brand-gold text-brand-gold-foreground hover:bg-brand-gold/90 whitespace-nowrap">
        Subscribe
      </Button>
    </form>
  )
}
