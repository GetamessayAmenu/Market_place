import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

export function useSearch(q?: string) {
  return useQuery(['search', q], async () => {
    const res = await apiGet('/search', { q })
    return res
  }, { enabled: !!q })
}
