'use client'

import { Button, Modal, useToast } from '@marketplace/ui'
import React, { useState } from 'react'

export interface MarkUnavailableButtonProps {
  listingId: string
  listingTitle: string
  isOwner: boolean
}

export default function MarkUnavailableButton({ listingId, listingTitle, isOwner }: MarkUnavailableButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Only show to listing owner
  if (!isOwner) return null

  const handleMarkUnavailable = async () => {
    setLoading(true)

    try {
      // TODO: Implement API call to mark listing unavailable
      // await fetch(`/api/listings/${listingId}/mark-unavailable`, {
      //   method: 'PATCH',
      // })

      // Simulate success for now
      console.log('Marking listing as unavailable:', listingId)
      
      toast({
        title: 'Listing marked as unavailable',
        description: 'Your listing has been hidden from search results.',
        variant: 'success',
      })
      setIsOpen(false)
      // Optionally redirect or refresh
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update listing. Please try again.',
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
        className="w-full sm:w-auto"
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
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
        Mark Unavailable
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Mark as Unavailable?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will hide <span className="font-medium text-foreground">{listingTitle}</span> from search results and
            mark it as unavailable. You can make it available again later from your dashboard.
          </p>

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
            <Button
              onClick={handleMarkUnavailable}
              variant="destructive"
              className="flex-1"
              loading={loading}
            >
              Mark Unavailable
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
