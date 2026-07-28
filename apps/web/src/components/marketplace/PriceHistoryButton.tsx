'use client'

import { apiGet } from '../../lib/api'
import { Button, Modal } from '@marketplace/ui'
import React, { useState } from 'react'

export interface PriceHistoryButtonProps {
  listingId: string
  currentPrice: number
  currency: string
}

interface PriceHistoryEntry {
  price: number
  date: string
}

export default function PriceHistoryButton({ listingId, currentPrice, currency }: PriceHistoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [history, setHistory] = useState<PriceHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)

  const handleOpen = async () => {
    setIsOpen(true)
    setLoading(true)
    
    try {
      const data = await apiGet<PriceHistoryEntry[]>(`/listings/${listingId}/price-history`)
      setHistory(data)
    } catch (error) {
      console.error('Failed to fetch price history:', error)
      // Fallback to current price if fetch fails
      setHistory([
        { price: currentPrice, date: new Date().toISOString() },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="w-full sm:w-auto"
      >
        <svg
          className="h-4 w-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
        Price History
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Price History"
        size="md"
      >
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-2">
              {history.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {currency}{entry.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  {index === 0 && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      Current
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">No price history available</p>
          )}
        </div>
      </Modal>
    </>
  )
}
