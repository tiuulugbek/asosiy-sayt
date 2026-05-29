import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  createService,
  deleteService,
  fetchServiceById,
  fetchServices,
  reorderServices,
  updateService,
  type ServiceFilters,
} from '../services/services.service';
import type { CreateServicePayload, ServiceDto, UpdateServicePayload } from '../lib/api';
import { ApiError } from '../lib/api-error';

export function useServices(filters: ServiceFilters = {}) {
  return useQuery({
    queryKey: ['services', filters],
    queryFn: () => fetchServices(filters),
    staleTime: 30_000,
  });
}

export function useService(id: string | undefined) {
  return useQuery({
    queryKey: ['services', id],
    queryFn: () => fetchServiceById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation<ServiceDto, ApiError, CreateServicePayload>({
    mutationFn: createService,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      message.success("Xizmat qo'shildi");
    },
    onError: (e) => message.error(e.message),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation<ServiceDto, ApiError, { id: string; payload: UpdateServicePayload }>({
    mutationFn: ({ id, payload }) => updateService(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      message.success('Xizmat yangilandi');
    },
    onError: (e) => message.error(e.message),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: deleteService,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      message.success("Xizmat o'chirildi");
    },
    onError: (e) => message.error(e.message),
  });
}

export function useReorderServices() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string[]>({
    mutationFn: reorderServices,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (e) => message.error(e.message),
  });
}
