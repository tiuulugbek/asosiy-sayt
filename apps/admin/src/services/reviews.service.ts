import api from '../lib/axios';
import type { ReviewDto, UpdateReviewPayload } from '../lib/api';

export interface ReviewFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  rating?: number;
}

export interface UpdateReviewBody {
  status?: 'pending' | 'published' | 'rejected';
  name?: string;
  rating?: number;
  body?: string;
}

/** Admin ro'yxati — backend: GET /reviews/admin */
export async function fetchReviewsAdmin(): Promise<ReviewDto[]> {
  const { data } = await api.get<ReviewDto[]>('/reviews/admin');
  return data;
}

export async function updateReview(id: string, payload: UpdateReviewBody): Promise<ReviewDto> {
  const { data } = await api.patch<ReviewDto>(`/reviews/admin/${id}`, payload);
  return data;
}

export async function updateReviewStatus(id: string, payload: UpdateReviewPayload): Promise<ReviewDto> {
  return updateReview(id, payload);
}

export async function deleteReview(id: string): Promise<void> {
  await api.delete(`/reviews/admin/${id}`);
}
