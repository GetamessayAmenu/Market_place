"use client"
import { Button, Checkbox, cn } from '@marketplace/ui'
import React, { useCallback, useMemo, useState } from 'react'

import DeliveryEstimate from './DeliveryEstimate'
import PriceEstimator from './PriceEstimator'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MeasurementsData {
  chest: string
  waist: string
  hips: string
  shoulder: string
  sleeve: string
  length: string
  unit: 'cm' | 'in'
}

export interface CustomOrderFormData {
  measurements: MeasurementsData
  fabricChoice: string
  colorChoice: string
  designNotes: string
  referenceImages: string[]
  embroidery: boolean
  customPattern: boolean
  fitAdjustment: boolean
}

export interface CustomOrderFormProps {
  listingId: string
  basePrice: number
  estimatedDays: number
  currency?: string
  onSubmit: (data: CustomOrderFormData) => void
  isSubmitting?: boolean
  className?: string
}

const FABRIC_OPTIONS = ['Cotton', 'Silk', 'Linen', 'Chiffon', 'Satin', 'Velvet', 'Habesha Kemis Fabric', 'Tibeb']
const COLOR_OPTIONS = [
  { value: 'White', hex: '#FFFFFF' },
  { value: 'Black', hex: '#000000' },
  { value: 'Red', hex: '#DC2626' },
  { value: 'Blue', hex: '#2563EB' },
  { value: 'Green', hex: '#16A34A' },
  { value: 'Gold', hex: '#D4AF37' },
  { value: 'Burgundy', hex: '#800020' },
  { value: 'Ivory', hex: '#FFFFF0' },
  { value: 'Navy', hex: '#1E3A5F' },
  { value: 'Custom', hex: '#8B5CF6' },
]

const STEPS = ['Measurements', 'Fabric & Color', 'Design', 'Review']

const emptyMeasurements: MeasurementsData = {
  chest: '', waist: '', hips: '', shoulder: '', sleeve: '', length: '', unit: 'cm',
}

// ─── Step components ──────────────────────────────────────────────────────────

function MeasurementsStep({
  measurements,
  onChange,
}: {
  measurements: MeasurementsData
  onChange: (m: MeasurementsData) => void
}) {
  const fields = ['chest', 'waist', 'hips', 'shoulder', 'sleeve', 'length'] as const
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">Your Measurements</h3>
        <button
          type="button"
          onClick={() => { onChange({ ...measurements, unit: measurements.unit === 'cm' ? 'in' : 'cm' }) }}
          className="text-xs font-medium text-brand-gold hover:underline"
        >
          Switch to {measurements.unit === 'cm' ? 'inches' : 'cm'}
        </button>
      </div>
      <p className="text-sm text-muted-foreground">Enter your body measurements in {measurements.unit}.</p>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field) => (
          <div key={field}>
            <label htmlFor={`m-${field}`} className="mb-1 block text-xs font-medium capitalize text-muted-foreground">
              {field} ({measurements.unit})
            </label>
            <input
              id={`m-${field}`}
              type="number"
              min="0"
              max="200"
              step="0.5"
              value={measurements[field]}
              onChange={(e) => { onChange({ ...measurements, [field]: e.target.value }) }}
              placeholder="0"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function FabricColorStep({
  fabricChoice,
  colorChoice,
  onFabricChange,
  onColorChange,
}: {
  fabricChoice: string
  colorChoice: string
  onFabricChange: (v: string) => void
  onColorChange: (v: string) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-3">Fabric</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FABRIC_OPTIONS.map((fabric) => (
            <button
              key={fabric}
              type="button"
              onClick={() => { onFabricChange(fabric) }}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm transition-colors',
                fabricChoice === fabric
                  ? 'border-brand-gold bg-brand-gold/10 text-brand-gold font-medium'
                  : 'border-input bg-background text-muted-foreground hover:border-foreground/30'
              )}
            >
              {fabric}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-3">Color</h3>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => { onColorChange(color.value) }}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors',
                colorChoice === color.value
                  ? 'border-brand-gold bg-brand-gold/5 font-medium'
                  : 'border-transparent bg-muted/50 hover:bg-muted'
              )}
            >
              <span
                className="h-4 w-4 rounded-full ring-1 ring-inset ring-border"
                style={{ backgroundColor: color.hex }}
                aria-hidden="true"
              />
              {color.value}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function DesignStep({
  designNotes,
  embroidery,
  customPattern,
  fitAdjustment,
  onNotesChange,
  onEmbroideryChange,
  onCustomPatternChange,
  onFitAdjustmentChange,
}: {
  designNotes: string
  embroidery: boolean
  customPattern: boolean
  fitAdjustment: boolean
  onNotesChange: (v: string) => void
  onEmbroideryChange: (v: boolean) => void
  onCustomPatternChange: (v: boolean) => void
  onFitAdjustmentChange: (v: boolean) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-3">Customization Options</h3>
        <div className="space-y-3">
          <Checkbox label="Embroidery (Tibeb)" checked={embroidery} onChange={(e) => { onEmbroideryChange(e.target.checked) }} />
          <Checkbox label="Custom pattern/design" checked={customPattern} onChange={(e) => { onCustomPatternChange(e.target.checked) }} />
          <Checkbox label="Fit adjustments (e.g., longer hem, wider sleeves)" checked={fitAdjustment} onChange={(e) => { onFitAdjustmentChange(e.target.checked) }} />
        </div>
      </div>

      <div>
        <label htmlFor="design-notes" className="mb-1 block text-sm font-medium text-foreground">Design Notes</label>
        <textarea
          id="design-notes"
          rows={4}
          value={designNotes}
          onChange={(e) => { onNotesChange(e.target.value) }}
          placeholder="Describe your vision... special details, occasion, inspiration images"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/50 resize-none"
        />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CustomOrderForm({
  basePrice,
  estimatedDays,
  currency = 'ETB',
  onSubmit,
  isSubmitting,
  className,
}: CustomOrderFormProps) {
  const [step, setStep] = useState(0)
  const [measurements, setMeasurements] = useState<MeasurementsData>(emptyMeasurements)
  const [fabricChoice, setFabricChoice] = useState('')
  const [colorChoice, setColorChoice] = useState('')
  const [designNotes, setDesignNotes] = useState('')
  const [embroidery, setEmbroidery] = useState(false)
  const [customPattern, setCustomPattern] = useState(false)
  const [fitAdjustment, setFitAdjustment] = useState(false)

  const priceAdjustments = useMemo(() => {
    const adj: { label: string; amount: number }[] = []
    if (embroidery) adj.push({ label: 'Embroidery (Tibeb)', amount: Math.round(basePrice * 0.2) })
    if (customPattern) adj.push({ label: 'Custom pattern', amount: Math.round(basePrice * 0.15) })
    if (fitAdjustment) adj.push({ label: 'Fit adjustment', amount: Math.round(basePrice * 0.05) })
    return adj
  }, [basePrice, embroidery, customPattern, fitAdjustment])

  const canProceed = useCallback(() => {
    if (step === 0) {
      return Object.entries(measurements).some(([k, v]) => k !== 'unit' && v !== '')
    }
    return true
  }, [step, measurements])

  const handleSubmit = () => {
    onSubmit({
      measurements,
      fabricChoice,
      colorChoice,
      designNotes,
      referenceImages: [],
      embroidery,
      customPattern,
      fitAdjustment,
    })
  }

  return (
    <div className={cn('rounded-xl border bg-card p-6', className)}>
      {/* Step indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  i < step && 'bg-brand-gold text-brand-gold-foreground',
                  i === step && 'bg-brand-gold text-brand-gold-foreground ring-2 ring-brand-gold/30',
                  i > step && 'bg-muted text-muted-foreground'
                )}
              >
                {i < step ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  String(i + 1)
                )}
              </div>
              <span className={cn('text-xs hidden sm:inline', i <= step ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn('hidden sm:block w-8 h-px', i < step ? 'bg-brand-gold' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="min-h-[300px]">
        {step === 0 && (
          <MeasurementsStep measurements={measurements} onChange={setMeasurements} />
        )}
        {step === 1 && (
          <FabricColorStep
            fabricChoice={fabricChoice}
            colorChoice={colorChoice}
            onFabricChange={setFabricChoice}
            onColorChange={setColorChoice}
          />
        )}
        {step === 2 && (
          <DesignStep
            designNotes={designNotes}
            embroidery={embroidery}
            customPattern={customPattern}
            fitAdjustment={fitAdjustment}
            onNotesChange={setDesignNotes}
            onEmbroideryChange={setEmbroidery}
            onCustomPatternChange={setCustomPattern}
            onFitAdjustmentChange={setFitAdjustment}
          />
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-foreground">Review Your Order</h3>

            <div className="rounded-lg border bg-background p-4 space-y-3 text-sm">
              {fabricChoice && <div className="flex justify-between"><span className="text-muted-foreground">Fabric</span><span>{fabricChoice}</span></div>}
              {colorChoice && <div className="flex justify-between"><span className="text-muted-foreground">Color</span><span>{colorChoice}</span></div>}
              {embroidery && <div className="flex justify-between"><span className="text-muted-foreground">Embroidery</span><span>Yes</span></div>}
              {customPattern && <div className="flex justify-between"><span className="text-muted-foreground">Custom pattern</span><span>Yes</span></div>}
              {fitAdjustment && <div className="flex justify-between"><span className="text-muted-foreground">Fit adjustment</span><span>Yes</span></div>}
              {designNotes && (
                <div>
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="mt-1 whitespace-pre-wrap text-foreground/90">{designNotes}</p>
                </div>
              )}
            </div>

            <PriceEstimator basePrice={basePrice} adjustments={priceAdjustments} currency={currency} />
            <DeliveryEstimate productionDays={estimatedDays} />
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
        <Button
          variant="outline"
          onClick={() => { setStep(Math.max(0, step - 1)) }}
          {...(step === 0 ? { disabled: true } : {})}
        >
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => { setStep(step + 1) }}
            {...(!canProceed() ? { disabled: true } : {})}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            {...(isSubmitting ? { disabled: true } : {})}
            className="bg-brand-wine hover:bg-brand-wine/90"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Custom Order'}
          </Button>
        )}
      </div>
    </div>
  )
}
