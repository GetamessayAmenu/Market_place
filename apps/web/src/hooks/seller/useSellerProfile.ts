import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '../../lib/api';

export interface SellerProfile {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  location?: {
    subCity?: string;
    regionalHub?: string;
    address?: string;
  };
  verificationStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  storefrontUrl: string;
}

export function useSellerProfile(sellerId: string) {
  return useQuery<SellerProfile>({
    queryKey: ['seller-profile', sellerId],
    queryFn: async () => {
      const res = await apiGet<SellerProfile>('/seller/profile');
      return res;
    },
    enabled: !!sellerId,
  });
}

export function useUpdateSellerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SellerProfile>) => apiPatch('/seller/profile', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller-profile'] });
    },
  });
}
