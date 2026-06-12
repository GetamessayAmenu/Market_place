import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../lib/api'

import type { PaginatedResponse, Listing } from './useListings'

interface SellerProfile {
  id: string
  name: string
  email?: string
  bio?: string | null
  avatarUrl?: string | null
  phone?: string | null
  location?: string | null
  emailVerifiedAt?: string | null
  phoneVerifiedAt?: string | null
  createdAt: string
  _count?: {
    listings: number
  }
}

export function useSeller(sellerId: string) {
  return useQuery<{ success: boolean; data: SellerProfile }>({
    queryKey: ['seller', sellerId],
    queryFn: async () => {
      const res = await apiGet<{ success: boolean; data: SellerProfile }>(`/users/${sellerId}`)
      return res
    },
    enabled: !!sellerId,
  })
}

export function useSellerListings(sellerId: string, params?: { page?: number; limit?: number }) {
  return useQuery<PaginatedResponse<Listing>>({
    queryKey: ['seller-listings', sellerId, params],
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<Listing>>(`/users/${sellerId}/listings`, params)
      return res
    },
    enabled: !!sellerId,
    keepPreviousData: true,
  })
}

export type { SellerProfile }
