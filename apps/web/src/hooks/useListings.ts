import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../lib/api'

interface UseListingsParams {
  q?: string
  categoryId?: string
  categorySlug?: string
  city?: string
  condition?: string
  minPrice?: string
  maxPrice?: string
  sortBy?: string
  featured?: string
  page?: number
  limit?: number
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface Listing {
  id: string
  title: string
  slug: string
  description: string
  price: number
  condition: string
  city: string
  status: string
  isFeatured: boolean
  primaryImageUrl?: string | null
  images?: { url: string; isPrimary: boolean }[]
  seller?: {
    id: string
    name: string
    avatarUrl?: string | null
  }
  category?: {
    id: string
    name: string
    slug: string
  }
  _count?: {
    favorites: number
  }
  createdAt: string
}

export function useListings(params?: UseListingsParams) {
  return useQuery<PaginatedResponse<Listing>>({
    queryKey: ['listings', params],
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<Listing>>('/listings', params as Record<string, string | number | boolean | undefined>)
      return res
    },
    keepPreviousData: true,
  })
}

export type { UseListingsParams, PaginatedResponse, Listing }
