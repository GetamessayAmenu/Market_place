"use client"
import React, { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { apiGet } from '../lib/api'
import useAuth from '../hooks/useAuth'

const queryClient = new QueryClient()

export default function Providers({ children }: { children: React.ReactNode }) {
  const setUser = useAuth((s: any) => s.setUser)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await apiGet('/auth/me')
        if (mounted) setUser(res.data)
      } catch (e) {
        // not authenticated or error; ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [setUser])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
