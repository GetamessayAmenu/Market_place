'use client'

import { apiPost } from '../../lib/api'
import { Button, Modal, Input, Textarea, useToast } from '@marketplace/ui'
import React, { useState } from 'react'

export interface RequestCallbackButtonProps {
  listingId: string
  sellerId: string
  listingTitle: string
}

export default function RequestCallbackButton({ listingId, sellerId, listingTitle }: RequestCallbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    preferredTime: '',
    message: '',
  })
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiPost('/callback-requests', {
        ...formData,
        listingId,
        sellerId,
      })

      toast({
        title: 'Request sent!',
        description: 'The seller will contact you shortly.',
        variant: 'success',
      })
      setIsOpen(false)
      setFormData({ name: '', phone: '', preferredTime: '', message: '' })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send request. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        <svg
          className="h-4 w-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
        Request Callback
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Request a Callback"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              The seller will call you back about: <span className="font-medium text-foreground">{listingTitle}</span>
            </p>
          </div>

          <Input
            label="Your Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter your name"
          />

          <Input
            label="Phone Number"
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+251 912 345 678"
          />

          <Input
            label="Preferred Time"
            type="text"
            value={formData.preferredTime}
            onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
            placeholder="e.g., Morning, After 5 PM"
          />

          <Textarea
            label="Message (Optional)"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Any specific questions or requirements..."
            rows={3}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              Send Request
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
