"use client"

import { useState } from 'react'

import { Button, useToast } from '@marketplace/ui'
import { logout as adminLogout } from '../../lib/authClient'

export default function AdminLogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  async function handleLogout() {
    setIsLoading(true)
    try {
      await adminLogout()
      window.location.href = '/login'
    } catch {
      toast.addToast({ title: 'Logout failed', description: 'Could not sign out. Please try again.', variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="secondary" onClick={handleLogout} disabled={isLoading}>
      {isLoading ? 'Signing out...' : 'Sign out'}
    </Button>
  )
}
