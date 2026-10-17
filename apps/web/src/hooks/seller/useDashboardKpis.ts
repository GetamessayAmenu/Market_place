import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';

export interface DashboardKpis {
  listingViews: number;
  chatStarts: number;
  whatsappClicks: number;
  phoneReveals: number;
  pendingActions: number;
  activeListings?: number;
}

export function useDashboardKpis(sellerId: string) {
  return useQuery<DashboardKpis>({
    queryKey: ['dashboard-kpis', sellerId],
    queryFn: async () => {
      const res = await apiGet<DashboardKpis>('/seller/dashboard/kpis');
      return res;
    },
    enabled: !!sellerId,
  });
}
