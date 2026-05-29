import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardStats,
  fetchRecentLeads,
  fetchRecentReviews,
} from '../services/dashboard.service';
import { ApiError } from '../lib/api-error';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 60_000,
  });
}

export function useRecentLeads(limit = 5) {
  return useQuery({
    queryKey: ['dashboard-recent-leads', limit],
    queryFn: () => fetchRecentLeads(limit),
    staleTime: 30_000,
  });
}

export function useRecentReviews(limit = 5) {
  return useQuery({
    queryKey: ['dashboard-recent-reviews', limit],
    queryFn: () => fetchRecentReviews(limit),
    staleTime: 30_000,
  });
}

export type { ApiError };
