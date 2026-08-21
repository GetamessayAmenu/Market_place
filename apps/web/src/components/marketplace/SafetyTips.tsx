'use client'

import React, { useState } from 'react'

export interface SafetyTipsProps {
  className?: string
  context?: 'buyer' | 'seller' | 'both'
}

export default function SafetyTips({ className, context = 'both' }: SafetyTipsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const buyerTips = [
    'Contact the seller through the platform first to establish trust',
    'Meet in a safe, public place with other people around',
    'Inspect the item thoroughly before paying',
    'Only pay when you are satisfied with the item',
    'Use cash or secure payment methods you can reverse if needed',
    'Trust your instincts - if something feels wrong, walk away',
  ]

  const sellerTips = [
    'Verify the buyer before meeting - check their profile and reviews',
    'Meet in a safe, public location during daylight hours',
    'Bring a friend or family member for large transactions',
    'Accept cash or secure payment methods only',
    'Do not release the item until payment is confirmed',
    'Keep records of all communication through the platform',
  ]

  const tips = context === 'buyer' ? buyerTips : context === 'seller' ? sellerTips : [...buyerTips, ...sellerTips]

  return (
    <div className={className}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
            <svg
              className="h-5 w-5 text-amber-600 dark:text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Safety Tips</h3>
            <p className="text-sm text-muted-foreground">
              {context === 'buyer' ? 'Keep yourself safe when buying' : context === 'seller' ? 'Keep yourself safe when selling' : 'Safe buying and selling practices'}
            </p>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-2 rounded-lg border bg-card p-4">
          {context === 'both' && (
            <>
              <h4 className="font-medium text-sm text-foreground mb-3">For Buyers</h4>
              <ul className="space-y-2 mb-4" role="list">
                {buyerTips.map((tip, index) => (
                  <li key={`buyer-${index}`} className="flex gap-3 text-sm text-muted-foreground">
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <h4 className="font-medium text-sm text-foreground mb-3">For Sellers</h4>
            </>
          )}
          <ul className="space-y-2" role="list">
            {(context === 'both' ? sellerTips : tips).map((tip, index) => (
              <li key={index} className="flex gap-3 text-sm text-muted-foreground">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
            <p>If you encounter suspicious activity, report it to our support team immediately.</p>
          </div>
        </div>
      )}
    </div>
  )
}
