"use client"
import { ToastProvider } from '@marketplace/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useEffect } from 'react'

import useAuth from '../hooks/useAuth'
import type { AuthUser } from '../hooks/useAuth'
import { apiGet } from '../lib/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

interface MeResponse {
  user: AuthUser
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const setUser = useAuth((s) => s.setUser)
  const clear = useAuth((s) => s.clear)

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiGet<MeResponse>('/auth/me')
        setUser(res.user)
      } catch {
        clear()
      }
    })()
  }, [setUser, clear])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  )
}
