'use client'

import { apiPost } from '../../lib/api'
import { Button, Modal, RadioGroup, Textarea, useToast } from '@marketplace/ui'
import React, { useState } from 'react'

export interface ReportAbuseButtonProps {
  listingId: string
  listingTitle: string
}

const reportReasons = [
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'fake', label: 'Fake or misleading' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'duplicate', label: 'Duplicate listing' },
  { value: 'sold', label: 'Already sold elsewhere' },
  { value: 'other', label: 'Other' },
]

export default function ReportAbuseButton({ listingId, listingTitle }: ReportAbuseButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason) {
      toast({
        title: 'Error',
        description: 'Please select a reason',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      await apiPost('/reports', {
        targetType: 'listing',
        listingId,
        reason,
        description: details || undefined,
      })

      toast({
        title: 'Report submitted',
        description: 'Thank you for helping keep our community safe.',
        variant: 'success',
      })
      setIsOpen(false)
      setReason('')
      setDetails('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
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
        className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
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
            d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
          />
        </svg>
        Report Abuse
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Report This Listing"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Help us understand what's wrong with: <span className="font-medium text-foreground">{listingTitle}</span>
            </p>
          </div>

          <RadioGroup
            name="report-reason"
            label="Reason for reporting"
            value={reason}
            onChange={setReason}
            options={reportReasons}
          />

          <Textarea
            label="Additional Details (Optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Provide more information to help us review this report..."
            rows={4}
          />

          <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/10">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Reports are reviewed by our team. False reports may result in account restrictions.
            </p>
          </div>

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
              type="submit"
              variant="destructive"
              className="flex-1"
              loading={loading}
            >
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
