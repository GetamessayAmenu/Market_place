import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '../../lib/api';

export interface SellerProfile {
  id: string;
  displayName: string;
  email: string;
  phone?: string | undefined;
  location?: {
    subCity?: string | undefined;
    regionalHub?: string | undefined;
    address?: string | undefined;
  } | undefined;
  verificationStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  storefrontUrl: string;
}

export interface VerificationStatusData {
  status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  documents: {
    businessLicense?: string;
    tin?: string;
    artisanCertificate?: string;
    idDocument?: string;
    businessType?: string;
  };
}

export interface SellerPromotionsData {
  pinnedListings: string[];
  bannerText?: string | undefined;
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

export function useVerificationStatus(sellerId: string) {
  return useQuery<VerificationStatusData>({
    queryKey: ['seller-verification-status', sellerId],
    queryFn: async () => {
      const res = await apiGet<VerificationStatusData>('/seller/verification-status');
      return res;
    },
    enabled: !!sellerId,
  });
}

export function useSubmitVerificationDocuments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiPost('/seller/verification-documents', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller-verification-status'] });
      void qc.invalidateQueries({ queryKey: ['seller-profile'] });
    },
  });
}

export function useSellerPromotions(sellerId: string) {
  return useQuery<SellerPromotionsData>({
    queryKey: ['seller-promotions', sellerId],
    queryFn: async () => {
      const res = await apiGet<SellerPromotionsData>('/seller/promotions');
      return res;
    },
    enabled: !!sellerId,
  });
}

export function useUpdateSellerPromotions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SellerPromotionsData>) => apiPatch('/seller/promotions', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller-promotions'] });
    },
  });
}
