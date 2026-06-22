import { cn } from '@marketplace/ui'
import React from 'react'

export interface PriceEstimatorProps {
  basePrice: number
  adjustments?: { label: string; amount: number }[]
  currency?: string
  className?: string
}

export default function PriceEstimator({ basePrice, adjustments = [], currency = 'ETB', className }: PriceEstimatorProps) {
  const totalAdjustments = adjustments.reduce((sum, a) => sum + a.amount, 0)
  const total = basePrice + totalAdjustments

  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-3', className)}>
      <h3 className="font-display text-base font-semibold text-card-foreground">Price Estimate</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Base price</span>
          <span className="text-card-foreground">{basePrice.toLocaleString()} {currency}</span>
        </div>
        {adjustments.map((adj, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{adj.label}</span>
            <span className={adj.amount >= 0 ? 'text-card-foreground' : 'text-green-600'}>
              {adj.amount >= 0 ? '+' : ''}{adj.amount.toLocaleString()} {currency}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-sm font-semibold border-t border-border/50 pt-2">
        <span className="text-card-foreground">Estimated total</span>
        <span className="text-brand-gold text-lg">{total.toLocaleString()} {currency}</span>
      </div>
      <p className="text-xs text-muted-foreground italic">
        * This is an advisory estimate. The designer will confirm the final price.
      </p>
    </div>
  )
}
