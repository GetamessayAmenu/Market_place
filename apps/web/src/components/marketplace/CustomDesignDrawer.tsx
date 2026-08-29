"use client"

import { Alert, Drawer } from '@marketplace/ui'
import React, { useState } from 'react'
import CustomDesignRequestForm, { type CustomDesignFormData } from './CustomDesignRequestForm'

interface CustomDesignDrawerProps {
  open: boolean
  onClose: () => void
  listingId: string
  customizationOptions?: {
    requiresMeasurements: boolean
    fabricTypes: string[]
    colors: string[]
    embroideryTypes: string[]
    customNotesAllowed: boolean
  }
  onSuccess?: () => void
}

export default function CustomDesignDrawer({
  open,
  onClose,
  listingId,
  customizationOptions,
  onSuccess,
}: CustomDesignDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (data: CustomDesignFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          ...data,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit custom design request')
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        onSuccess?.()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit custom design request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Request Custom Design">
      <div className="space-y-4 p-2">
        {success && (
          <Alert variant="success">
            ✓ Custom design request submitted successfully! The seller will be notified.
          </Alert>
        )}

        {error && <Alert variant="error" onDismiss={() => setError(null)}>{error}</Alert>}

        <CustomDesignRequestForm
          customizationOptions={customizationOptions}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={onClose}
        />
      </div>
    </Drawer>
  )
}
