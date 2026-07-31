import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '../../lib/api';

export interface BlackoutDate {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export function useBlackoutDates(sellerId: string) {
  return useQuery<BlackoutDate[]>({
    queryKey: ['blackout-dates', sellerId],
    queryFn: async () => {
      const res = await apiGet<BlackoutDate[]>('/seller/blackout-dates');
      return res;
    },
    enabled: !!sellerId,
  });
}

export function useAddBlackoutDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BlackoutDate, 'id'>) => apiPost('/seller/blackout-dates', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['blackout-dates'] });
    },
  });
}

export function useDeleteBlackoutDate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/seller/blackout-dates/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['blackout-dates'] });
    },
  });
}
