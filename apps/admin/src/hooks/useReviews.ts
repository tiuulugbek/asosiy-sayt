import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  deleteReview,
  fetchReviewsAdmin,
  updateReview,
  type UpdateReviewBody,
} from '../services/reviews.service';
import type { ReviewDto } from '../lib/api';
import { ApiError } from '../lib/api-error';

export function useReviewsAdmin() {
  return useQuery<ReviewDto[], ApiError>({
    queryKey: ['reviews', 'admin'],
    queryFn: fetchReviewsAdmin,
    staleTime: 30_000,
  });
}

export function useUpdateReview() {
  const qc = useQueryClient();
  return useMutation<ReviewDto, ApiError, { id: string; payload: UpdateReviewBody }>({
    mutationFn: ({ id, payload }) => updateReview(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', 'admin'] });
      message.success('Sharh yangilandi');
    },
    onError: (e) => message.error(e.message || 'Xatolik'),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: deleteReview,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', 'admin'] });
      message.success("Sharh o'chirildi");
    },
    onError: (e) => message.error(e.message || "O'chirishda xatolik"),
  });
}
