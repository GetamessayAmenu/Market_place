"use client"

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button, useToast } from '@marketplace/ui'
import { logout as adminLogout } from '../../lib/authClient'

export default function AdminLogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

  async function handleLogout() {
    setIsLoading(true)
    try {
      await adminLogout()
      toast.addToast({ title: 'Signed out', description: 'You have been securely logged out.', variant: 'success' })
      router.push('/login')
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
