"use client"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useEffect } from 'react'

import useAuth from '../hooks/useAuth'
import { apiGet } from '../lib/api'

const queryClient = new QueryClient()

interface AuthMeResponse {
  success: boolean
  data: { id: string; name?: string; email?: string }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const setUser = useAuth((s) => s.setUser)

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiGet<AuthMeResponse>('/auth/me')
        setUser(res.data)
      } catch {
        // not authenticated or error; ignore
      }
    })()
  }, [setUser])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
