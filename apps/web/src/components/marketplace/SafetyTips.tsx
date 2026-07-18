'use client'

import { Alert } from '@marketplace/ui'
import React, { useState } from 'react'

export interface SafetyTipsProps {
  className?: string
}

export default function SafetyTips({ className }: SafetyTipsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const tips = [
    'Avoid paying in advance, even for delivery',
    'Meet with the seller at a safe public place',
    "Inspect the item and ensure it's exactly what you want",
    "Make sure that the packed item is the one you've inspected",
    "Only pay if you're satisfied",
  ]

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
            <p className="text-sm text-muted-foreground">Keep yourself safe when buying</p>
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
          <ul className="space-y-2" role="list">
            {tips.map((tip, index) => (
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
        </div>
      )}
    </div>
  )
}
