import { Modal, cn } from '@marketplace/ui'
import React from 'react'

export interface OrderChoiceModalProps {
  open: boolean
  onClose: () => void
  onBuy: () => void
  onCustomOrder: () => void
  buyPrice: number
  currency?: string
  customOrderEstimate?: { price: number; days: number }
}

export default function OrderChoiceModal({
  open,
  onClose,
  onBuy,
  onCustomOrder,
  buyPrice,
  currency = 'ETB',
  customOrderEstimate,
}: OrderChoiceModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="How would you like to order?">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose how you want to get this item. Buy it as-is or order a custom-made version tailored to your preferences.
        </p>

        <div className="grid gap-3">
          {/* Buy As-Is */}
          <button
            type="button"
            onClick={onBuy}
            className={cn(
              'flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all',
              'hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500',
              'border-border'
            )}
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Buy As-Is</p>
              <p className="text-sm text-muted-foreground">Get the exact item shown in the photos</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">{buyPrice.toLocaleString()} {currency}</p>
              <p className="text-xs text-muted-foreground">Ready to ship</p>
            </div>
          </button>

          {/* Custom Order */}
          <button
            type="button"
            onClick={onCustomOrder}
            className={cn(
              'flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all',
              'hover:border-brand-wine hover:bg-brand-wine/5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-wine',
              'border-border'
            )}
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-wine/10 text-brand-wine">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Order Custom Made</p>
              <p className="text-sm text-muted-foreground">Tailored to your measurements and preferences</p>
            </div>
            <div className="text-right">
              {customOrderEstimate ? (
                <>
                  <p className="text-lg font-bold text-brand-wine">~{customOrderEstimate.price.toLocaleString()} {currency}</p>
                  <p className="text-xs text-muted-foreground">~{String(customOrderEstimate.days)} days</p>
                </>
              ) : (
                <p className="text-sm font-medium text-brand-wine">Get quote</p>
              )}
            </div>
          </button>
        </div>
      </div>
    </Modal>
  )
}
