import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import {
  createListing,
  deleteListing,
  fetchMyListing,
  fetchMyListings,
  getSignedUpload,
  hideListing,
  markListingSold,
  publishListing,
  renewListing,
  updateListing,
  type SellerListing,
  type SellerListingsResponse,
} from '../lib/sellerApi';

// ─── Query hooks ─────────────────────────────────────────────────────────────

interface UseMyListingsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
}

export function useMyListings(userId: string, params?: UseMyListingsParams) {
  return useQuery<SellerListingsResponse>({
    queryKey: ['my-listings', userId, params],
    queryFn: async () => {
      const queryParams: Record<string, string | number | boolean | undefined> = {
        sellerId: userId,
        page: params?.page ?? 1,
        limit: params?.limit ?? 12,
      };
      if (params?.status) queryParams.status = params.status;
      if (params?.search) queryParams.search = params.search;
      if (params?.sortBy) queryParams.sortBy = params.sortBy;
      return fetchMyListings(queryParams);
    },
    keepPreviousData: true,
    enabled: !!userId,
  });
}

export function useMyListing(id: string | undefined) {
  return useQuery<SellerListing>({
    queryKey: ['my-listing', id],
    queryFn: async () => {
      if (!id) throw new Error('Listing ID required');
      const res = await fetchMyListing(id);
      return res.data;
    },
    enabled: !!id,
  });
}

// ─── Mutation hooks ──────────────────────────────────────────────────────────

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createListing(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });
}

export function useUpdateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateListing(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-listings'] });
      void qc.invalidateQueries({ queryKey: ['my-listing'] });
    },
  });
}

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hard }: { id: string; hard?: boolean }) => deleteListing(id, hard),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });
}

export function useMarkSold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markListingSold(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-listings'] });
      void qc.invalidateQueries({ queryKey: ['my-listing'] });
    },
  });
}

export function useRenewListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => renewListing(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-listings'] });
      void qc.invalidateQueries({ queryKey: ['my-listing'] });
    },
  });
}

export function useHideListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hideListing(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-listings'] });
      void qc.invalidateQueries({ queryKey: ['my-listing'] });
    },
  });
}

export function usePublishListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => publishListing(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-listings'] });
      void qc.invalidateQueries({ queryKey: ['my-listing'] });
    },
  });
}

// ─── Upload hook ─────────────────────────────────────────────────────────────

export interface UploadedImage {
  url: string;
  cloudinaryPublicId: string;
  sortOrder: number;
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImage = useCallback(async (file: File): Promise<UploadedImage | null> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const signs = await getSignedUpload(1);
      const sign = signs[0];
      if (!sign) {
        setUploadError('Failed to get upload signature');
        return null;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sign.apiKey);
      formData.append('timestamp', String(sign.timestamp));
      formData.append('signature', sign.signature);
      formData.append('folder', sign.folder);
      if (sign.transformation) {
        formData.append('transformation', sign.transformation);
      }

      const uploadUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`;
      const response = await fetch(uploadUrl, { method: 'POST', body: formData });

      if (!response.ok) {
        const err = await response.json() as { error?: { message?: string } };
        setUploadError(err.error?.message ?? 'Upload failed');
        return null;
      }

      const result = await response.json() as { secure_url: string; public_id: string };
      return {
        url: result.secure_url,
        cloudinaryPublicId: result.public_id,
        sortOrder: 0,
      };
    } catch {
      setUploadError('Network error during upload');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { uploadImage, isUploading, uploadError, clearError: () => { setUploadError(null); } };
}

export type { UseMyListingsParams };
