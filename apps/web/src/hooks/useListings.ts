import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

export function useListings(params?: Record<string, any>) {
  return useQuery(['listings', params], async () => {
    const res = await apiGet('/listings', params)
    return res
  })
}
