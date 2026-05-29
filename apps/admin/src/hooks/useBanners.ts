import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  createBanner,
  deleteBanner,
  fetchBanners,
  reorderBanners,
  updateBanner,
} from '../services/banners.service';
import type { BannerDto, CreateBannerPayload, UpdateBannerPayload } from '../lib/api';
import { ApiError } from '../lib/api-error';

export function useBanners() {
  return useQuery<BannerDto[], ApiError>({
    queryKey: ['banners'],
    queryFn: fetchBanners,
    staleTime: 30_000,
  });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation<BannerDto, ApiError, CreateBannerPayload>({
    mutationFn: createBanner,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['banners'] });
      qc.invalidateQueries({ queryKey: ['banners-admin'] });
      message.success('Slayd saqlandi');
    },
    onError: (e) => message.error(e.message || 'Xatolik'),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation<BannerDto, ApiError, { id: string; payload: UpdateBannerPayload }>({
    mutationFn: ({ id, payload }) => updateBanner(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['banners'] });
      qc.invalidateQueries({ queryKey: ['banners-admin'] });
      message.success('Slayd yangilandi');
    },
    onError: (e) => message.error(e.message || 'Xatolik'),
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: deleteBanner,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['banners'] });
      qc.invalidateQueries({ queryKey: ['banners-admin'] });
      message.success("Slayd o'chirildi");
    },
    onError: (e) => message.error(e.message || "O'chirishda xatolik"),
  });
}

export function useReorderBanners() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string[]>({
    mutationFn: reorderBanners,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['banners'] });
      qc.invalidateQueries({ queryKey: ['banners-admin'] });
    },
    onError: (e) => message.error(e.message || 'Tartibni saqlashda xatolik'),
  });
}
