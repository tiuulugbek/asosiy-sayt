import api from '../lib/axios';
import type { BannerDto, CreateBannerPayload, UpdateBannerPayload } from '../lib/api';
import { normalizeList } from '../lib/types';

export async function fetchBanners(): Promise<BannerDto[]> {
  const { data } = await api.get<BannerDto[] | { items?: BannerDto[]; data?: BannerDto[] }>(
    '/banners/admin',
  );
  return normalizeList(data);
}

export async function fetchBannerById(id: string): Promise<BannerDto> {
  const list = await fetchBanners();
  const found = list.find((b) => b.id === id);
  if (!found) {
    const { data } = await api.get<BannerDto>(`/banners/${id}`).catch(() => ({ data: null }));
    if (data) return data as BannerDto;
    throw new Error('Slayd topilmadi');
  }
  return found;
}

export async function createBanner(payload: CreateBannerPayload): Promise<BannerDto> {
  const { data } = await api.post<BannerDto>('/banners', payload);
  return data;
}

export async function updateBanner(id: string, payload: UpdateBannerPayload): Promise<BannerDto> {
  const { data } = await api.patch<BannerDto>(`/banners/${id}`, payload);
  return data;
}

export async function deleteBanner(id: string): Promise<void> {
  await api.delete(`/banners/${id}`);
}

export async function reorderBanners(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id, index) => updateBanner(id, { order: index * 10 })));
}
