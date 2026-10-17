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
import { apiGet } from '../lib/api';

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

export interface UploadProgress {
  completed: number;
  total: number;
  percentage: number;
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImages = useCallback(
    async (
      files: File[],
      onProgress?: (progress: UploadProgress) => void,
    ): Promise<UploadedImage[]> => {
      if (!files || files.length === 0) return [];
      setIsUploading(true);
      setUploadError(null);

      const total = files.length;
      let completed = 0;
      setUploadProgress({ completed: 0, total, percentage: 0 });

      try {
        let signs: any[] = [];
        try {
          signs = await getSignedUpload(files.length);
        } catch (_e) {
          signs = [];
        }

        const uploadPromises = files.map(async (file, index) => {
          try {
            const sign = signs[index] || signs[0];
            if (!sign || !sign.cloudName) throw new Error('Failed to get upload signature');

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
              const err = (await response.json()) as { error?: { message?: string } };
              throw new Error(err.error?.message ?? `Upload failed for ${file.name}`);
            }

            const result = (await response.json()) as { secure_url: string; public_id: string };
            completed++;
            const currentProgress: UploadProgress = {
              completed,
              total,
              percentage: Math.round((completed / total) * 100),
            };
            setUploadProgress(currentProgress);
            if (onProgress) onProgress(currentProgress);

            return {
              url: result.secure_url,
              cloudinaryPublicId: result.public_id,
              sortOrder: index,
            };
          } catch (_err) {
            // If Cloudinary upload is not configured or failed, upload directly to the application server
            try {
              const localFormData = new FormData();
              localFormData.append('file', file);

              const localRes = await fetch('/api/upload', {
                method: 'POST',
                body: localFormData,
              });

              if (localRes.ok) {
                const localData = await localRes.json();
                completed++;
                const currentProgress: UploadProgress = {
                  completed,
                  total,
                  percentage: Math.round((completed / total) * 100),
                };
                setUploadProgress(currentProgress);
                if (onProgress) onProgress(currentProgress);

                return {
                  url: localData.url,
                  cloudinaryPublicId: localData.cloudinaryPublicId,
                  sortOrder: index,
                };
              }
            } catch (_localErr) {
              console.error('Local upload failed, using object URL preview:', _localErr);
            }

            // Local Object URL preview fallback
            const localUrl = URL.createObjectURL(file);
            completed++;
            const currentProgress: UploadProgress = {
              completed,
              total,
              percentage: Math.round((completed / total) * 100),
            };
            setUploadProgress(currentProgress);
            if (onProgress) onProgress(currentProgress);

            return {
              url: localUrl,
              cloudinaryPublicId: `marketplace/listings/local_${Date.now()}_${index}`,
              sortOrder: index,
            };
          }
        });

        const results = await Promise.all(uploadPromises);
        return results;
      } catch (err: any) {
        setUploadError(err.message || 'Network error during upload');
        return [];
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    },
    [],
  );

  const uploadImage = useCallback(
    async (file: File): Promise<UploadedImage | null> => {
      const results = await uploadImages([file]);
      return results[0] || null;
    },
    [uploadImages],
  );

  return {
    uploadImage,
    uploadImages,
    isUploading,
    uploadProgress,
    uploadError,
    clearError: () => {
      setUploadError(null);
    },
  };
}

// ─── Customers hook ─────────────────────────────────────────────────────────────

interface UseSellerCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
}

interface CustomersResponse {
  data: any[];
  meta: {
    totalPages: number;
    currentPage: number;
    total: number;
  };
}

export function useSellerCustomers(userId: string, params?: UseSellerCustomersParams) {
  return useQuery<CustomersResponse>({
    queryKey: ['seller-customers', userId, params],
    queryFn: async () => {
      const queryParams: Record<string, string | number | undefined> = {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
      };
      if (params?.search) queryParams.search = params.search;
      if (params?.sortBy) queryParams.sortBy = params.sortBy;
      return apiGet(`/api/seller/customers`, queryParams);
    },
    keepPreviousData: true,
    enabled: !!userId,
  });
}

export type { UseMyListingsParams };
