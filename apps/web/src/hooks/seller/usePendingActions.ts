import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';

export type PendingActionType =
  | 'new_inquiry'
  | 'rental_request'
  | 'handover'
  | 'return'
  | 'unread_message'
  | 'approval'
  | 'rejection'
  | 'changes_requested'
  | 'custom_order'
  | 'profile_completion';

export interface PendingAction {
  id: string;
  type: PendingActionType;
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  relatedId?: string;
  href?: string;
  createdAt: string;
}

export function usePendingActions(sellerId: string) {
  return useQuery<PendingAction[]>({
    queryKey: ['pending-actions', sellerId],
    queryFn: async () => {
      const res = await apiGet<PendingAction[]>('/seller/dashboard/pending-actions');
      return res || [];
    },
    enabled: !!sellerId,
  });
}
