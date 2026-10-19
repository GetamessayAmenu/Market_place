"use client"
import { Button, cn } from '@marketplace/ui'
import Link from 'next/link'
import React, { useState } from 'react'

export interface SellerContactProps {
  sellerId: string
  sellerName: string
  phone?: string | null
  email?: string | null
  location?: string | null
  className?: string
}

export default function SellerContact({
  sellerId,
  sellerName,
  phone,
  email: _email,
  location,
  className,
}: SellerContactProps) {
  const [phoneRevealed, setPhoneRevealed] = useState(false)

  return (
    <section className={cn('space-y-4', className)} aria-labelledby="seller-contact-heading">
      <h2 id="seller-contact-heading" className="text-lg font-display font-bold text-foreground">
        Contact {sellerName}
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Message */}
        <Link href={`/dashboard/messages?seller=${sellerId}`} className="block">
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-card-foreground">Send Message</p>
              <p className="text-xs text-muted-foreground">Direct in-app messaging</p>
            </div>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Phone */}
        {phone != null && phone.length > 0 && (
          <button
            type="button"
            onClick={() => { setPhoneRevealed(true) }}
            className="block text-left"
          >
            <div className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-card-foreground">
                  {phoneRevealed ? phone : 'Show Phone Number'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {phoneRevealed ? 'Tap to call' : 'Click to reveal'}
                </p>
              </div>
              {phoneRevealed && (
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          </button>
        )}


        {/* Location */}
        {location != null && location.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-terra/10 text-brand-terra">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-card-foreground">Location</p>
              <p className="text-xs text-muted-foreground">{location}</p>
            </div>
          </div>
        )}
      </div>

      {/* CTA when phone revealed */}
      {phoneRevealed && phone != null && (
        <div className="flex gap-3">
          <a href={`tel:${phone}`} className="flex-1">
            <Button variant="primary" className="w-full gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Seller
            </Button>
          </a>
          <a
            href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" className="w-full gap-2 border-border hover:bg-accent">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              </svg>
              WhatsApp
            </Button>
          </a>
        </div>
      )}
    </section>
  )
}
