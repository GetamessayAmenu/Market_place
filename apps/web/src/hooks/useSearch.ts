import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../lib/api'

import type { PaginatedResponse, Listing } from './useListings'

interface UseSearchParams {
  q?: string | undefined
  categoryId?: string | undefined
  categorySlug?: string | undefined
  city?: string | undefined
  condition?: string | undefined
  minPrice?: string | undefined
  maxPrice?: string | undefined
  sortBy?: string | undefined
  featured?: string | undefined
  verified?: string | undefined
  page?: number | undefined
  limit?: number | undefined
}

export function useSearch(params?: UseSearchParams) {
  return useQuery<PaginatedResponse<Listing>>({
    queryKey: ['search', params],
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<Listing>>('/search', params as Record<string, string | number | boolean | undefined>)
      return res
    },
    enabled: !!params?.q,
    keepPreviousData: true,
  })
}

export type { UseSearchParams }
