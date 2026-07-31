import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';

export interface EngagementMetric {
  label: string;
  value: number;
  change: number;
  icon?: React.ReactNode;
}

export function useEngagementMetrics(sellerId: string) {
  return useQuery<EngagementMetric[]>({
    queryKey: ['engagement-metrics', sellerId],
    queryFn: async () => {
      const res = await apiGet<EngagementMetric[]>('/seller/dashboard/engagement-metrics');
      return res;
    },
    enabled: !!sellerId,
  });
}
