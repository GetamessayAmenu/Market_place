import { cn } from '@marketplace/ui'
import React from 'react'

export interface DeliveryEstimateProps {
  productionDays: number
  shippingDays?: number
  className?: string
}

export default function DeliveryEstimate({ productionDays, shippingDays = 3, className }: DeliveryEstimateProps) {
  const totalDays = productionDays + shippingDays

  const formatDate = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-3', className)}>
      <h3 className="font-display text-base font-semibold text-card-foreground">Delivery Estimate</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Production</span>
          <span className="text-card-foreground">{String(productionDays)} days</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-card-foreground">{String(shippingDays)} days</span>
        </div>
      </div>
      <div className="flex justify-between text-sm font-semibold border-t border-border/50 pt-2">
        <span className="text-card-foreground">Estimated delivery</span>
        <span className="text-brand-gold">
          {formatDate(productionDays)} - {formatDate(totalDays)}
        </span>
      </div>
    </div>
  )
}
