import { useQuery } from '@tanstack/react-query'

import { apiGet } from '../lib/api'

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  parentId?: string | null
  children?: Category[]
  _count?: {
    listings: number
  }
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiGet<Category[]>('/categories'),
    staleTime: 5 * 60 * 1000,
  })
}

export type { Category }
