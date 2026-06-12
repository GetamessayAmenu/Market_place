import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiDelete, apiGet, apiPost } from '../lib/api'

import type { PaginatedResponse, Listing } from './useListings'

export function useFavorites() {
  return useQuery<PaginatedResponse<Listing>>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<Listing>>('/favorites')
      return res
    },
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ listingId, isFavorited }: { listingId: string; isFavorited: boolean }) => {
      if (isFavorited) {
        await apiDelete(`/listings/${listingId}/favorite`)
      } else {
        await apiPost(`/listings/${listingId}/favorite`)
      }
      return { listingId, isFavorited: !isFavorited }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites'] })
      void queryClient.invalidateQueries({ queryKey: ['listings'] })
    },
  })
}
