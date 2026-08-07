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
  return useQuery<{ success: boolean; data: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiGet<Category[]>('/categories')
      return { success: true, data: res }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export type { Category }
