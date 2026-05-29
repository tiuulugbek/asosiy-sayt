import dayjs from 'dayjs';
import api from '../lib/axios';
import type { LeadDto, ReviewDto } from '../lib/api';

export interface DashboardStats {
  totalServices: number;
  totalDoctors: number;
  totalBranches: number;
  totalLeads: number;
  totalPatients: number;
  totalReviews: number;
  leadsToday: number;
  leadsTrend: number;
  visitsToday: number;
  visitsTrend: number;
}

/** Backend /dashboard/stats yo'q — mavjud endpointlardan hisoblanadi */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [services, doctors, branches, leads, reviews, traffic] = await Promise.all([
    api.get<unknown[]>('/services/admin').then((r) => r.data).catch(() => []),
    api.get<unknown[]>('/doctors/admin').then((r) => r.data).catch(() => []),
    api.get<unknown[]>('/branches').then((r) => r.data).catch(() => []),
    api.get<LeadDto[]>('/leads').then((r) => r.data).catch(() => []),
    api.get<ReviewDto[]>('/reviews/admin').then((r) => r.data).catch(() => []),
    api
      .get<{ summary?: { visits?: number }; daily?: { date: string; visits: number }[] }>('/traffic/report?days=30')
      .then((r) => r.data)
      .catch(() => null),
  ]);

  const now = dayjs();
  const thisMonth = (leads as LeadDto[]).filter((l) => dayjs(l.createdAt).isSame(now, 'month'));
  const prevMonth = (leads as LeadDto[]).filter((l) =>
    dayjs(l.createdAt).isSame(now.subtract(1, 'month'), 'month'),
  );
  const leadsTrend =
    prevMonth.length > 0
      ? Math.round(((thisMonth.length - prevMonth.length) / prevMonth.length) * 100)
      : 0;

  const todayStr = now.format('YYYY-MM-DD');
  const leadsToday = (leads as LeadDto[]).filter((l) =>
    dayjs(l.createdAt).format('YYYY-MM-DD') === todayStr,
  ).length;

  const daily = traffic?.daily ?? [];
  const visitsToday = daily.find((d) => d.date === todayStr)?.visits ?? traffic?.summary?.visits ?? 0;
  const half = Math.floor(daily.length / 2);
  const recentVisits = daily.slice(half).reduce((s, d) => s + d.visits, 0);
  const olderVisits = daily.slice(0, half).reduce((s, d) => s + d.visits, 0);
  const visitsTrend = olderVisits > 0 ? Math.round(((recentVisits - olderVisits) / olderVisits) * 100) : 0;

  return {
    totalServices: Array.isArray(services) ? services.length : 0,
    totalDoctors: Array.isArray(doctors) ? doctors.length : 0,
    totalBranches: Array.isArray(branches) ? branches.length : 0,
    totalLeads: Array.isArray(leads) ? leads.length : 0,
    totalPatients: 0,
    totalReviews: Array.isArray(reviews) ? reviews.length : 0,
    leadsToday,
    leadsTrend,
    visitsToday,
    visitsTrend,
  };
}

export async function fetchRecentLeads(limit = 5): Promise<LeadDto[]> {
  const { data } = await api.get<LeadDto[]>('/leads');
  return [...data]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function fetchRecentReviews(limit = 5): Promise<ReviewDto[]> {
  const { data } = await api.get<ReviewDto[]>('/reviews/admin');
  return [...data]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
