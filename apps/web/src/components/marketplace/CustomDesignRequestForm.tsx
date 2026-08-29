"use client"

import { Alert, Button, FormInput, FormTextarea, Spinner } from '@marketplace/ui'
import React, { useState } from 'react'

export interface CustomDesignFormData {
  selectedSize?: string
  measurements?: {
    bust?: number
    waist?: number
    hips?: number
    height?: number
    shoulderToHem?: number
    shoulder?: number
    sleeve?: number
    length?: number
    unit?: 'cm' | 'in'
  }
  selectedFabric?: string
  selectedColor?: string
  embroideryNotes?: string
  inspirationImages?: string[]
  customerNotes?: string
}

interface CustomDesignRequestFormProps {
  customizationOptions?: {
    requiresMeasurements: boolean
    fabricTypes: string[]
    colors: string[]
    embroideryTypes: string[]
    customNotesAllowed: boolean
  } | undefined
  onSubmit: (data: CustomDesignFormData) => Promise<void>
  isSubmitting?: boolean
  onCancel?: () => void
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom']

const DEFAULT_FABRICS = ['Cotton', 'Silk', 'Linen', 'Tibeb', 'Saba', 'Menen']
const DEFAULT_COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Gold', 'Purple']

export default function CustomDesignRequestForm({
  customizationOptions,
  onSubmit,
  isSubmitting = false,
  onCancel,
}: CustomDesignRequestFormProps) {
  const [formData, setFormData] = useState<CustomDesignFormData>({
    selectedSize: 'M',
    measurements: {
      unit: 'cm',
    },
  })
  const [error, setError] = useState<string | null>(null)

  const requiresMeasurements = customizationOptions?.requiresMeasurements ?? true
  const fabricTypes = customizationOptions?.fabricTypes.length 
    ? customizationOptions.fabricTypes 
    : DEFAULT_FABRICS
  const colors = customizationOptions?.colors.length 
    ? customizationOptions.colors 
    : DEFAULT_COLORS
  const allowsNotes = customizationOptions?.customNotesAllowed ?? true

  const updateField = <K extends keyof CustomDesignFormData>(
    key: K,
    value: CustomDesignFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const updateMeasurement = <K extends keyof NonNullable<CustomDesignFormData['measurements']>>(
    key: K,
    value: NonNullable<CustomDesignFormData['measurements']>[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      measurements: { ...prev.measurements, [key]: value }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (requiresMeasurements) {
      const measurements = formData.measurements
      if (!measurements?.bust || !measurements?.waist || !measurements?.height) {
        setError('Please provide at least bust, waist, and height measurements')
        return
      }
    }

    try {
      await onSubmit(formData)
    } catch (err: any) {
      setError(err.message || 'Failed to submit custom design request')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>}

      {/* Size Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Size Preference
        </label>
        <div className="flex flex-wrap gap-2">
          {SIZES.map(size => (
            <button
              key={size}
              type="button"
              onClick={() => updateField('selectedSize', size)}
              className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                formData.selectedSize === size
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Measurements Section */}
      {requiresMeasurements && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Body Measurements</h4>
            <div className="mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="unit"
                  value="cm"
                  checked={formData.measurements?.unit === 'cm'}
                  onChange={() => updateMeasurement('unit', 'cm')}
                  className="h-4 w-4"
                />
                <span className="text-sm">Centimeters (cm)</span>
              </label>
              <label className="flex items-center gap-2 ml-6">
                <input
                  type="radio"
                  name="unit"
                  value="in"
                  checked={formData.measurements?.unit === 'in'}
                  onChange={() => updateMeasurement('unit', 'in')}
                  className="h-4 w-4"
                />
                <span className="text-sm">Inches (in)</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="Bust"
                type="number"
                placeholder="0"
                value={formData.measurements?.bust ?? ''}
                onChange={(e) => updateMeasurement('bust', parseFloat(e.target.value) || undefined)}
              />
              <FormInput
                label="Waist"
                type="number"
                placeholder="0"
                value={formData.measurements?.waist ?? ''}
                onChange={(e) => updateMeasurement('waist', parseFloat(e.target.value) || undefined)}
              />
              <FormInput
                label="Hips"
                type="number"
                placeholder="0"
                value={formData.measurements?.hips ?? ''}
                onChange={(e) => updateMeasurement('hips', parseFloat(e.target.value) || undefined)}
              />
              <FormInput
                label="Height"
                type="number"
                placeholder="0"
                value={formData.measurements?.height ?? ''}
                onChange={(e) => updateMeasurement('height', parseFloat(e.target.value) || undefined)}
              />
              <FormInput
                label="Shoulder to Hem"
                type="number"
                placeholder="0"
                value={formData.measurements?.shoulderToHem ?? ''}
                onChange={(e) => updateMeasurement('shoulderToHem', parseFloat(e.target.value) || undefined)}
              />
              <FormInput
                label="Shoulder Width"
                type="number"
                placeholder="0"
                value={formData.measurements?.shoulder ?? ''}
                onChange={(e) => updateMeasurement('shoulder', parseFloat(e.target.value) || undefined)}
              />
              <FormInput
                label="Sleeve Length"
                type="number"
                placeholder="0"
                value={formData.measurements?.sleeve ?? ''}
                onChange={(e) => updateMeasurement('sleeve', parseFloat(e.target.value) || undefined)}
              />
              <FormInput
                label="Total Length"
                type="number"
                placeholder="0"
                value={formData.measurements?.length ?? ''}
                onChange={(e) => updateMeasurement('length', parseFloat(e.target.value) || undefined)}
              />
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              💡 Need help? <a href="#" className="text-primary hover:underline">View measurement guide</a>
            </p>
          </div>
        </div>
      )}

      {/* Fabric Selection */}
      {fabricTypes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Fabric Choice
          </label>
          <div className="flex flex-wrap gap-2">
            {fabricTypes.map(fabric => (
              <button
                key={fabric}
                type="button"
                onClick={() => updateField('selectedFabric', fabric)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  formData.selectedFabric === fabric
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {fabric}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selection */}
      {colors.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Color Preference
          </label>
          <div className="flex flex-wrap gap-2">
            {colors.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => updateField('selectedColor', color)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  formData.selectedColor === color
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Embroidery Notes */}
      <div>
        <FormTextarea
          label="Embroidery/Tilf Style Notes"
          placeholder="Describe any specific embroidery patterns or Tilf styles you'd like..."
          value={formData.embroideryNotes ?? ''}
          onChange={(e) => updateField('embroideryNotes', e.target.value)}
          rows={3}
        />
      </div>

      {/* Customer Notes */}
      {allowsNotes && (
        <div>
          <FormTextarea
            label="Additional Notes"
            placeholder="Any other customization requests or special instructions..."
            value={formData.customerNotes ?? ''}
            onChange={(e) => updateField('customerNotes', e.target.value)}
            rows={3}
          />
        </div>
      )}

      {/* Inspiration Images (placeholder for Cloudinary integration) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Inspiration Images (Optional)
        </label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">
            📷 Upload reference images for your custom design
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Drag and drop or click to upload (Cloudinary integration)
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" />
              Submitting Request...
            </span>
          ) : (
            'Submit Custom Design Request'
          )}
        </Button>
      </div>
    </form>
  )
}
