'use client'

import React, { useMemo, useState } from 'react'

const SELLER_TYPES = [
  { value: 'designer', label: 'Fashion Designer' },
  { value: 'tailor', label: 'Tailor' },
  { value: 'boutique', label: 'Boutique Owner' },
  { value: 'rental', label: 'Rental Shop' },
  { value: 'jewelry', label: 'Jewelry Maker' },
  { value: 'shoes', label: 'Shoe Maker' },
] as const

const COMMISSION_RATE = 0.1 // 10% platform commission

export default function EarningsCalculator() {
  const [sellerType, setSellerType] = useState('designer')
  const [avgPrice, setAvgPrice] = useState(2500)
  const [monthlySales, setMonthlySales] = useState(10)
  const [hasRentals, setHasRentals] = useState(false)
  const [rentalCount, setRentalCount] = useState(5)
  const [rentalPrice, setRentalPrice] = useState(500)

  const earnings = useMemo(() => {
    const salesRevenue = avgPrice * monthlySales
    const salesAfterCommission = salesRevenue * (1 - COMMISSION_RATE)
    const rentalRevenue = hasRentals ? rentalPrice * rentalCount : 0
    const rentalAfterCommission = rentalRevenue * (1 - COMMISSION_RATE)
    const totalMonthly = salesAfterCommission + rentalAfterCommission
    const totalYearly = totalMonthly * 12

    return {
      salesRevenue,
      salesAfterCommission,
      rentalRevenue,
      rentalAfterCommission,
      totalMonthly,
      totalYearly,
      commission: salesRevenue * COMMISSION_RATE + rentalRevenue * COMMISSION_RATE,
    }
  }, [avgPrice, monthlySales, hasRentals, rentalCount, rentalPrice])

  const formatETB = (n: number) =>
    new Intl.NumberFormat('en-ET', { style: 'decimal', maximumFractionDigits: 0 }).format(Math.round(n))

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Inputs */}
      <div className="space-y-6">
        <div>
          <label htmlFor="calc-seller-type" className="block text-sm font-medium text-foreground mb-2">
            I am a...
          </label>
          <select
            id="calc-seller-type"
            value={sellerType}
            onChange={(e) => { setSellerType(e.target.value) }}
            className="w-full rounded-lg border bg-card px-4 py-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {SELLER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="calc-avg-price" className="block text-sm font-medium text-foreground mb-2">
            Average product price (ETB)
          </label>
          <input
            id="calc-avg-price"
            type="range"
            min={200}
            max={25000}
            step={100}
            value={avgPrice}
            onChange={(e) => { setAvgPrice(Number(e.target.value)) }}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>200 ETB</span>
            <span className="font-semibold text-foreground text-base">{formatETB(avgPrice)} ETB</span>
            <span>25,000 ETB</span>
          </div>
        </div>

        <div>
          <label htmlFor="calc-monthly-sales" className="block text-sm font-medium text-foreground mb-2">
            Estimated monthly sales
          </label>
          <input
            id="calc-monthly-sales"
            type="range"
            min={1}
            max={100}
            step={1}
            value={monthlySales}
            onChange={(e) => { setMonthlySales(Number(e.target.value)) }}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1</span>
            <span className="font-semibold text-foreground text-base">{monthlySales} items</span>
            <span>100</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={hasRentals}
            onClick={() => { setHasRentals(!hasRentals) }}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${hasRentals ? 'bg-brand-gold' : 'bg-muted'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${hasRentals ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm font-medium text-foreground">I also offer rentals</span>
        </div>

        {hasRentals && (
          <div className="space-y-4 rounded-lg border border-brand-gold/20 bg-brand-gold/5 p-4">
            <div>
              <label htmlFor="calc-rental-count" className="block text-sm font-medium text-foreground mb-2">
                Monthly rentals
              </label>
              <input
                id="calc-rental-count"
                type="range"
                min={1}
                max={50}
                step={1}
                value={rentalCount}
                onChange={(e) => { setRentalCount(Number(e.target.value)) }}
                className="w-full accent-brand-gold"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span className="font-semibold text-foreground text-base">{rentalCount} rentals</span>
                <span>50</span>
              </div>
            </div>
            <div>
              <label htmlFor="calc-rental-price" className="block text-sm font-medium text-foreground mb-2">
                Average rental price per day (ETB)
              </label>
              <input
                id="calc-rental-price"
                type="range"
                min={100}
                max={5000}
                step={50}
                value={rentalPrice}
                onChange={(e) => { setRentalPrice(Number(e.target.value)) }}
                className="w-full accent-brand-gold"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>100 ETB</span>
                <span className="font-semibold text-foreground text-base">{formatETB(rentalPrice)} ETB</span>
                <span>5,000 ETB</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-brand-gold/5 to-brand-wine/5 p-6 md:p-8">
        <h4 className="font-display text-lg font-bold text-foreground mb-6">Your Estimated Earnings</h4>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-card/80 p-4">
            <div>
              <p className="text-sm text-muted-foreground">Monthly sales revenue</p>
              <p className="text-xs text-muted-foreground">{monthlySales} items × {formatETB(avgPrice)} ETB</p>
            </div>
            <p className="text-lg font-bold text-foreground">{formatETB(earnings.salesRevenue)} ETB</p>
          </div>

          {hasRentals && earnings.rentalRevenue > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-card/80 p-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly rental revenue</p>
                <p className="text-xs text-muted-foreground">{rentalCount} rentals × {formatETB(rentalPrice)} ETB</p>
              </div>
              <p className="text-lg font-bold text-brand-gold">{formatETB(earnings.rentalRevenue)} ETB</p>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg bg-card/80 p-4">
            <div>
              <p className="text-sm text-muted-foreground">Platform fee (10%)</p>
              <p className="text-xs text-muted-foreground">Covers payments, support & marketing</p>
            </div>
            <p className="text-lg font-medium text-red-600">-{formatETB(earnings.commission)} ETB</p>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between rounded-xl bg-primary/10 p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Monthly earnings</p>
                <p className="text-xs text-muted-foreground">After platform fees</p>
              </div>
              <p className="text-2xl font-bold text-primary">{formatETB(earnings.totalMonthly)} ETB</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-brand-gold/10 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Yearly potential</p>
              <p className="text-xs text-muted-foreground">12 months of growth</p>
            </div>
            <p className="text-2xl font-bold text-brand-gold">{formatETB(earnings.totalYearly)} ETB</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          * Estimates are illustrative. Actual earnings depend on product quality, pricing, and marketing effort.
        </p>
      </div>
    </div>
  )
}
