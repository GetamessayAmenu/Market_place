import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';

export interface Analytics {
  listingViews: number;
  chatStarts: number;
  whatsappClicks: number;
  phoneReveals: number;
  conversionRate: number;
  period: string;
}

export function useAnalytics(sellerId: string, period: string = '30d') {
  return useQuery<Analytics>({
    queryKey: ['analytics', sellerId, period],
    queryFn: async () => {
      const res = await apiGet<Analytics>('/seller/analytics', { period });
      return res;
    },
    enabled: !!sellerId,
  });
}
