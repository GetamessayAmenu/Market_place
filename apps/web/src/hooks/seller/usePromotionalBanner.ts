import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';

export interface PromotionalBannerData {
  id: string;
  title: string;
  description?: string;
  badgeText?: string;
  actionUrl?: string;
  actionText?: string;
}

export function usePromotionalBanner() {
  return useQuery<PromotionalBannerData | null>({
    queryKey: ['seller-promotional-banner'],
    queryFn: async () => {
      try {
        const res = await apiGet<PromotionalBannerData | null>('/seller/dashboard/promotional-banner');
        return res || null;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}
