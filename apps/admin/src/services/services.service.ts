import api from '../lib/axios';
import type { CreateServicePayload, ServiceDto, UpdateServicePayload } from '../lib/api';
import { normalizeList, type PaginatedResponse } from '../lib/types';

export interface ServiceFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export async function fetchServices(filters: ServiceFilters = {}): Promise<PaginatedResponse<ServiceDto>> {
  const { data } = await api.get<ServiceDto[]>('/services/admin');
  let items = normalizeList(data);

  if (filters.status) {
    items = items.filter((s) => s.status === filters.status);
  }
  if (filters.search?.trim()) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (s) => s.title_uz.toLowerCase().includes(q) || (s.title_ru?.toLowerCase().includes(q) ?? false),
    );
  }

  items.sort((a, b) => a.order - b.order);

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);

  return {
    items: paged,
    total: items.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(items.length / limit)),
  };
}

export async function fetchServiceById(id: string): Promise<ServiceDto> {
  const { data } = await api.get<ServiceDto>(`/services/admin/${id}`);
  return data;
}

export async function createService(payload: CreateServicePayload): Promise<ServiceDto> {
  const { data } = await api.post<ServiceDto>('/services', payload);
  return data;
}

export async function updateService(id: string, payload: UpdateServicePayload): Promise<ServiceDto> {
  const { data } = await api.patch<ServiceDto>(`/services/${id}`, payload);
  return data;
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}

/** Tartib — PATCH /services/reorder yo'q, har biri uchun order yangilanadi */
export async function reorderServices(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id, index) => updateService(id, { order: index * 10 })));
}
