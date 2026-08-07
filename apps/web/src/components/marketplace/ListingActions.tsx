"use client"
import { Badge, Button, cn } from '@marketplace/ui'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { useAuth } from '../../hooks/useAuth'

import OrderChoiceModal from './OrderChoiceModal'
import RentDatePicker from './RentDatePicker'
import CustomOrderForm from './CustomOrderForm'

export interface ListingActionsProps {
  listingId: string
  price: number
  currency: string
  availableForPurchase: boolean
  availableForRent: boolean
  customOrderAvailable: boolean
  rentalPricePerDay: number | null
  rentalDeposit: number | null
  sellerId: string
  className?: string
  // Unified custom design fields
  supportsReadyMade?: boolean
  supportsCustomDesign?: boolean
  startingCustomPrice?: number | null
  estimatedProductionDays?: number | null
  customizationOptions?: {
    requiresMeasurements: boolean
    fabricTypes: string[]
    colors: string[]
    embroideryTypes: string[]
    customNotesAllowed: boolean
  }
}

export default function ListingActions({
  listingId,
  price,
  currency,
  availableForPurchase,
  availableForRent,
  customOrderAvailable,
  rentalPricePerDay,
  rentalDeposit,
  sellerId,
  className,
  supportsReadyMade = true,
  supportsCustomDesign = false,
  startingCustomPrice,
  estimatedProductionDays,
  customizationOptions,
}: ListingActionsProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [showChoiceModal, setShowChoiceModal] = useState(false)
  const [showRentPicker, setShowRentPicker] = useState(false)
  const [showCustomOrderForm, setShowCustomOrderForm] = useState(false)
  const [rentStart, setRentStart] = useState('')
  const [rentEnd, setRentEnd] = useState('')
  const [orderType, setOrderType] = useState<'ready-made' | 'custom'>('ready-made')

  const isOwnListing = user?.id === sellerId
  const hasBothOptions = supportsReadyMade && supportsCustomDesign

  const handleBuyClick = () => {
    if (!user) {
      router.push(`/login?redirect=/listings/${listingId}`)
      return
    }
    if (hasBothOptions) {
      setOrderType('ready-made')
      setShowChoiceModal(true)
    } else if (supportsReadyMade) {
      router.push(`/checkout/buy/${listingId}`)
    } else {
      setShowCustomOrderForm(true)
    }
  }

  const handleRentClick = () => {
    if (!user) {
      router.push(`/login?redirect=/listings/${listingId}`)
      return
    }
    setShowRentPicker(!showRentPicker)
    setRentStart('')
    setRentEnd('')
  }

  const handleCustomOrderClick = () => {
    if (!user) {
      router.push(`/login?redirect=/listings/${listingId}`)
      return
    }
    if (hasBothOptions) {
      setOrderType('custom')
      setShowChoiceModal(true)
    } else {
      setShowCustomOrderForm(true)
    }
  }

  const handleRentConfirm = () => {
    if (!rentStart || !rentEnd) return
    const start = new Date(rentStart)
    const end = new Date(rentEnd)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (days < 1) return
    router.push(`/checkout/rent/${listingId}?start=${rentStart}&end=${rentEnd}&days=${String(days)}`)
  }

  const handleRentDays = () => {
    if (!rentStart || !rentEnd) return 0
    const start = new Date(rentStart)
    const end = new Date(rentEnd)
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Order Type Selector - shown when both options are available */}
      {hasBothOptions && (
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setOrderType('ready-made')}
            className={cn(
              'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
              orderType === 'ready-made'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Buy Ready-Made
          </button>
          <button
            onClick={() => setOrderType('custom')}
            className={cn(
              'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
              orderType === 'custom'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Order Custom Design
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        {orderType === 'ready-made' && supportsReadyMade && (
          <>
            {availableForPurchase && (
              <Button
                onClick={handleBuyClick}
                disabled={isOwnListing}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isOwnListing ? 'Your Listing' : `Buy Now — ${currency} ${price.toLocaleString()}`}
              </Button>
            )}

            {availableForRent && rentalPricePerDay != null && (
              <Button
                variant="outline"
                onClick={handleRentClick}
                disabled={isOwnListing}
                className="w-full border-2 border-brand-gold text-brand-gold hover:bg-brand-gold/10"
              >
                Rent — {currency} {rentalPricePerDay.toLocaleString()}/day
              </Button>
            )}
          </>
        )}

        {orderType === 'custom' && supportsCustomDesign && (
          <div className="space-y-3">
            <div className="p-3 bg-brand-wine/5 border border-brand-wine/20 rounded-lg">
              <p className="text-sm font-medium text-brand-wine">Starting from {currency} {startingCustomPrice?.toLocaleString() || 'Contact for price'}</p>
              {estimatedProductionDays && (
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated production: {estimatedProductionDays} days
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleCustomOrderClick}
              disabled={isOwnListing}
              className="w-full border-2 border-brand-wine text-brand-wine hover:bg-brand-wine/10"
            >
              Order Custom Design
            </Button>
          </div>
        )}

        {!hasBothOptions && (
          <>
            {supportsReadyMade && availableForPurchase && (
              <Button
                onClick={handleBuyClick}
                disabled={isOwnListing}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isOwnListing ? 'Your Listing' : `Buy Now — ${currency} ${price.toLocaleString()}`}
              </Button>
            )}

            {availableForRent && rentalPricePerDay != null && (
              <Button
                variant="outline"
                onClick={handleRentClick}
                disabled={isOwnListing}
                className="w-full border-2 border-brand-gold text-brand-gold hover:bg-brand-gold/10"
              >
                Rent — {currency} {rentalPricePerDay.toLocaleString()}/day
              </Button>
            )}

            {supportsCustomDesign && (
              <Button
                variant="outline"
                onClick={handleCustomOrderClick}
                disabled={isOwnListing}
                className="w-full border-2 border-brand-wine text-brand-wine hover:bg-brand-wine/10"
              >
                Order Custom Made
              </Button>
            )}
          </>
        )}
      </div>

      {/* Availability badges */}
      <div className="flex flex-wrap gap-2">
        {supportsReadyMade && <Badge variant="success">Ready-made</Badge>}
        {supportsCustomDesign && <Badge variant="info">Custom Design</Badge>}
        {availableForRent && <Badge variant="warning">Available to Rent</Badge>}
      </div>

      {/* Rent date picker */}
      {showRentPicker && availableForRent && rentalPricePerDay != null && (
        <div className="rounded-lg border bg-card p-4">
          <RentDatePicker
            startDate={rentStart}
            endDate={rentEnd}
            onStartDateChange={setRentStart}
            onEndDateChange={setRentEnd}
            pricePerDay={rentalPricePerDay}
            currency={currency}
          />
          {rentalDeposit != null && rentalDeposit > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Security deposit: {currency} {rentalDeposit.toLocaleString()} (refundable)
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Button
              onClick={handleRentConfirm}
              disabled={handleRentDays() < 1}
              className="flex-1 bg-brand-gold text-brand-gold-foreground hover:bg-brand-gold/90"
            >
              Proceed to Checkout
            </Button>
            <Button variant="outline" onClick={() => { setShowRentPicker(false) }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Choice modal */}
      <OrderChoiceModal
        open={showChoiceModal}
        buyPrice={price}
        currency={currency}
        onBuy={() => { setShowChoiceModal(false); router.push(`/checkout/buy/${listingId}`) }}
        onCustomOrder={() => { setShowChoiceModal(false); setShowCustomOrderForm(true) }}
        onClose={() => { setShowChoiceModal(false) }}
      />

      {/* Custom Order Form */}
      {showCustomOrderForm && (
        <CustomOrderForm
          listingId={listingId}
          sellerId={sellerId}
          startingPrice={startingCustomPrice}
          estimatedDays={estimatedProductionDays}
          customizationOptions={customizationOptions}
          onClose={() => { setShowCustomOrderForm(false) }}
          onSuccess={() => { setShowCustomOrderForm(false) }}
        />
      )}
    </div>
  )
}
