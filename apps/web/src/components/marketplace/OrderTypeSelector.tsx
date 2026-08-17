"use client"

import { Button } from '@marketplace/ui'
import React, { useState } from 'react'

type OrderType = 'ready-made' | 'custom-design'

interface OrderTypeSelectorProps {
  supportsReadyMade: boolean
  supportsCustomDesign: boolean
  onTypeChange: (type: OrderType) => void
  readyMadePrice?: number
  customPrice?: number
  productionDays?: number
}

export default function OrderTypeSelector({
  supportsReadyMade,
  supportsCustomDesign,
  onTypeChange,
  readyMadePrice,
  customPrice,
  productionDays,
}: OrderTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<OrderType>(
    supportsReadyMade ? 'ready-made' : 'custom-design'
  )

  const handleTypeChange = (type: OrderType) => {
    setSelectedType(type)
    onTypeChange(type)
  }

  // If only one option is available, don't show the selector
  if (supportsReadyMade && !supportsCustomDesign) {
    return null
  }
  if (!supportsReadyMade && supportsCustomDesign) {
    return null
  }

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-medium text-foreground">Choose Order Type</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {supportsReadyMade && (
          <button
            type="button"
            onClick={() => handleTypeChange('ready-made')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedType === 'ready-made'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="text-center space-y-2">
              <div className="text-2xl">🛍️</div>
              <div className="font-medium text-sm">Buy Ready-Made</div>
              {readyMadePrice && (
                <div className="text-xs text-muted-foreground">
                  ETB {readyMadePrice.toLocaleString()}
                </div>
              )}
            </div>
          </button>
        )}

        {supportsCustomDesign && (
          <button
            type="button"
            onClick={() => handleTypeChange('custom-design')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedType === 'custom-design'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="text-center space-y-2">
              <div className="text-2xl">✂️</div>
              <div className="font-medium text-sm">Custom Design</div>
              {customPrice && (
                <div className="text-xs text-muted-foreground">
                  From ETB {customPrice.toLocaleString()}
                </div>
              )}
              {productionDays && (
                <div className="text-xs text-muted-foreground">
                  {productionDays} days production
                </div>
              )}
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
