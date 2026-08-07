"use client"
import { Button, FormInput, FormSelect, FormTextarea, Alert, Spinner } from '@marketplace/ui'
import React, { useState } from 'react'

import { useAuth } from '../../hooks/useAuth'

interface CustomOrderFormProps {
  listingId: string
  sellerId: string
  startingPrice?: number | null
  estimatedDays?: number | null
  customizationOptions?: {
    requiresMeasurements: boolean
    fabricTypes: string[]
    colors: string[]
    embroideryTypes: string[]
    customNotesAllowed: boolean
  }
  onClose: () => void
  onSuccess: () => void
}

export default function CustomOrderForm({
  listingId,
  sellerId,
  startingPrice,
  estimatedDays,
  customizationOptions,
  onClose,
  onSuccess,
}: CustomOrderFormProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    selectedSize: '',
    measurements: {
      bust: '',
      waist: '',
      hips: '',
      height: '',
      shoulderToHem: '',
    },
    selectedFabric: '',
    selectedColor: '',
    embroideryNotes: '',
    buyerNotes: '',
    inspirationImages: [] as string[],
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleMeasurementChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      measurements: { ...prev.measurements, [field]: value }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Validate required fields based on customization options
      if (customizationOptions?.requiresMeasurements) {
        const measurements = formData.measurements
        if (!measurements.bust || !measurements.waist || !measurements.hips) {
          throw new Error('Please provide required measurements')
        }
      }

      // Prepare submission data
      const submissionData = {
        listingId,
        ...(formData.selectedSize ? { selectedSize: formData.selectedSize } : {}),
        ...(customizationOptions?.requiresMeasurements ? { measurements: formData.measurements } : {}),
        ...(formData.selectedFabric ? { selectedFabric: formData.selectedFabric } : {}),
        ...(formData.selectedColor ? { selectedColor: formData.selectedColor } : {}),
        ...(formData.embroideryNotes ? { embroideryNotes: formData.embroideryNotes } : {}),
        ...(formData.buyerNotes ? { buyerNotes: formData.buyerNotes } : {}),
        ...(formData.inspirationImages.length > 0 ? { inspirationImages: formData.inspirationImages } : {}),
      }

      // API call to create custom order
      const response = await fetch('/api/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to submit custom order' }))
        throw new Error(errorData.message || 'Failed to submit custom order')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit custom order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Custom Order Request</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Size Selection */}
        <FormInput
          label="Size (if applicable)"
          placeholder="e.g., M, L, XL"
          value={formData.selectedSize}
          onChange={(e) => handleInputChange('selectedSize', e.target.value)}
        />

        {/* Measurements - shown if required */}
        {customizationOptions?.requiresMeasurements && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
            <h4 className="text-sm font-medium">Body Measurements (cm)</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput
                label="Bust"
                type="number"
                placeholder="90"
                value={formData.measurements.bust}
                onChange={(e) => handleMeasurementChange('bust', e.target.value)}
                required
              />
              <FormInput
                label="Waist"
                type="number"
                placeholder="70"
                value={formData.measurements.waist}
                onChange={(e) => handleMeasurementChange('waist', e.target.value)}
                required
              />
              <FormInput
                label="Hips"
                type="number"
                placeholder="95"
                value={formData.measurements.hips}
                onChange={(e) => handleMeasurementChange('hips', e.target.value)}
                required
              />
              <FormInput
                label="Height"
                type="number"
                placeholder="170"
                value={formData.measurements.height}
                onChange={(e) => handleMeasurementChange('height', e.target.value)}
              />
              <FormInput
                label="Shoulder to Hem"
                type="number"
                placeholder="120"
                value={formData.measurements.shoulderToHem}
                onChange={(e) => handleMeasurementChange('shoulderToHem', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Fabric Selection */}
        {customizationOptions?.fabricTypes && customizationOptions.fabricTypes.length > 0 && (
          <FormSelect
            label="Fabric Preference"
            value={formData.selectedFabric}
            onChange={(e) => handleInputChange('selectedFabric', e.target.value)}
          >
            <option value="">Select fabric type</option>
            {customizationOptions.fabricTypes.map(fabric => (
              <option key={fabric} value={fabric}>{fabric}</option>
            ))}
          </FormSelect>
        )}

        {/* Color Selection */}
        {customizationOptions?.colors && customizationOptions.colors.length > 0 && (
          <FormSelect
            label="Color Preference"
            value={formData.selectedColor}
            onChange={(e) => handleInputChange('selectedColor', e.target.value)}
          >
            <option value="">Select color</option>
            {customizationOptions.colors.map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </FormSelect>
        )}

        {/* Embroidery Notes */}
        {customizationOptions?.embroideryTypes && customizationOptions.embroideryTypes.length > 0 && (
          <FormTextarea
            label="Embroidery/Tilf Style Notes"
            placeholder="Describe your preferred embroidery style..."
            rows={3}
            value={formData.embroideryNotes}
            onChange={(e) => handleInputChange('embroideryNotes', e.target.value)}
          />
        )}

        {/* Custom Notes */}
        {customizationOptions?.customNotesAllowed && (
          <FormTextarea
            label="Additional Notes"
            placeholder="Any other customization requests..."
            rows={3}
            value={formData.buyerNotes}
            onChange={(e) => handleInputChange('buyerNotes', e.target.value)}
          />
        )}

        {/* Price Info */}
        {startingPrice && (
          <div className="p-3 bg-brand-wine/5 border border-brand-wine/20 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Starting Price:</span> {startingPrice.toLocaleString()} ETB
            </p>
            {estimatedDays && (
              <p className="text-xs text-muted-foreground mt-1">
                Estimated production time: {estimatedDays} days
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-brand-wine text-white hover:bg-brand-wine/90"
          >
            {isSubmitting ? <><Spinner size="sm" /> Submitting...</> : 'Send Custom Order Request'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}