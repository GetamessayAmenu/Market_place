"use client"
import { Badge, Button, cn } from '@marketplace/ui'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { useAuth } from '../../hooks/useAuth'

import OrderChoiceModal from './OrderChoiceModal'
import RentDatePicker from './RentDatePicker'

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
}: ListingActionsProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [showChoiceModal, setShowChoiceModal] = useState(false)
  const [showRentPicker, setShowRentPicker] = useState(false)
  const [rentStart, setRentStart] = useState('')
  const [rentEnd, setRentEnd] = useState('')

  const isOwnListing = user?.id === sellerId

  const handleBuyClick = () => {
    if (!user) {
      router.push(`/login?redirect=/listings/${listingId}`)
      return
    }
    if (customOrderAvailable) {
      setShowChoiceModal(true)
    } else {
      router.push(`/checkout/buy/${listingId}`)
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
      router.push(`/login?redirect=/custom-order/${listingId}`)
      return
    }
    router.push(`/custom-order/${listingId}`)
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
      {/* Action buttons */}
      <div className="flex flex-col gap-3">
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

        {customOrderAvailable && (
          <Button
            variant="outline"
            onClick={handleCustomOrderClick}
            disabled={isOwnListing}
            className="w-full border-2 border-brand-wine text-brand-wine hover:bg-brand-wine/10"
          >
            Order Custom Made
          </Button>
        )}
      </div>

      {/* Availability badges */}
      <div className="flex flex-wrap gap-2">
        {availableForPurchase && <Badge variant="success">Available to Buy</Badge>}
        {availableForRent && <Badge variant="warning">Available to Rent</Badge>}
        {customOrderAvailable && <Badge variant="info">Custom Orders</Badge>}
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
        onCustomOrder={() => { setShowChoiceModal(false); router.push(`/custom-order/${listingId}`) }}
        onClose={() => { setShowChoiceModal(false) }}
      />
    </div>
  )
}
