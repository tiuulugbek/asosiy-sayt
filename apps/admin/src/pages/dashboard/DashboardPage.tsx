import { useMemo } from 'react';
import { Table, Button, Skeleton } from 'antd';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Inbox,
  Star,
  Stethoscope,
  Newspaper,
  ArrowRight,
  ExternalLink,
  Activity,
} from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import {
  getLeads,
  getReviewsAdmin,
  getDoctors,
  getPosts,
  LeadDto,
  ReviewDto,
  ApiError,
} from '../../lib/api';

export default function DashboardPage() {
  const { data: leads, isLoading: leadsLoading } = useQuery<LeadDto[], ApiError>({
    queryKey: ['leads'],
    queryFn: getLeads,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<ReviewDto[], ApiError>({
    queryKey: ['reviews-admin'],
    queryFn: getReviewsAdmin,
  });

  const { data: doctors, isLoading: doctorsLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  });

  const loading = leadsLoading || reviewsLoading || doctorsLoading || postsLoading;

  const stats = useMemo(() => {
    const now = dayjs();
    const monthLeads = (leads ?? []).filter((l) => dayjs(l.createdAt).isSame(now, 'month'));
    const prevMonthLeads = (leads ?? []).filter((l) =>
      dayjs(l.createdAt).isSame(now.subtract(1, 'month'), 'month'),
    );
    const leadsTrendPct =
      prevMonthLeads.length > 0
        ? Math.round(((monthLeads.length - prevMonthLeads.length) / prevMonthLeads.length) * 100)
        : null;
    const newLeads = (leads ?? []).filter((l) => l.status === 'new');
    const activeDoctors = (doctors ?? []).filter((d: { status?: string }) => d.status === 'published');
    const draftPosts = (posts ?? []).filter((p: { status?: string }) => p.status === 'draft');
    const pendingReviews = (reviews ?? []).filter((r) => r.status === 'pending');

    return {
      monthLeads: monthLeads.length,
      leadsTrendPct,
      totalLeads: leads?.length ?? 0,
      newLeads: newLeads.length,
      totalReviews: reviews?.length ?? 0,
      pendingReviews: pendingReviews.length,
      activeDoctors: activeDoctors.length,
      totalDoctors: doctors?.length ?? 0,
      totalPosts: posts?.length ?? 0,
      draftPosts: draftPosts.length,
    };
  }, [leads, reviews, doctors, posts]);

  const recentLeads = useMemo(
    () =>
      [...(leads ?? [])]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [leads],
  );

  const recentPosts = useMemo(
    () =>
      [...(posts ?? [])]
        .sort(
          (a: { createdAt?: string }, b: { createdAt?: string }) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
        )
        .slice(0, 4),
    [posts],
  );

  const recentReviews = useMemo(
    () =>
      [...(reviews ?? [])]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4),
    [reviews],
  );

  const leadColumns: ColumnsType<LeadDto> = [
    { title: 'ID', dataIndex: 'id', width: 80, render: (id: string) => id.slice(0, 8) },
    { title: 'Ism', dataIndex: 'name', ellipsis: true },
    { title: 'Telefon', dataIndex: 'phone' },
    {
      title: 'Sana',
      dataIndex: 'createdAt',
      render: (d: string) => dayjs(d).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      render: (s: string) => <StatusBadge status={s} />,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton active paragraph={{ rows: 1 }} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} active paragraph={{ rows: 2 }} />
          ))}
        </div>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Bosh sahifa"
        description="Acoustic.uz admin paneliga xush kelibsiz"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Inbox size={20} />}
          title="So'rovlar"
          value={stats.monthLeads}
          subtitle={`Jami: ${stats.totalLeads} · Yangi: ${stats.newLeads}`}
          trend={
            stats.leadsTrendPct != null
              ? {
                  value: `${stats.leadsTrendPct >= 0 ? '↑' : '↓'} ${Math.abs(stats.leadsTrendPct)}% o'tgan oyga`,
                  up: stats.leadsTrendPct >= 0,
                }
              : { value: "— O'zgarish yo'q", up: true }
          }
        />
        <StatCard
          icon={<Star size={20} />}
          title="Sharhlar"
          value={stats.totalReviews}
          subtitle={`Kutilmoqda: ${stats.pendingReviews}`}
        />
        <StatCard
          icon={<Stethoscope size={20} />}
          title="Mutaxassislar"
          value={stats.activeDoctors}
          subtitle={`Jami: ${stats.totalDoctors}`}
        />
        <StatCard
          icon={<Newspaper size={20} />}
          title="Yangiliklar"
          value={stats.totalPosts}
          subtitle={`Draft: ${stats.draftPosts}`}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="admin-content-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="font-semibold text-[var(--admin-text)]">So'nggi so'rovlar</h2>
            <Link to="/leads">
              <Button type="link" icon={<ArrowRight size={14} />}>
                Barchasi
              </Button>
            </Link>
          </div>
          <Table
            className="admin-table"
            columns={leadColumns}
            dataSource={recentLeads}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </div>

        <div className="space-y-4">
          <div className="admin-content-card p-5">
            <h2 className="mb-4 font-semibold text-[var(--admin-text)]">Tezkor havolalar</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/leads', label: "So'rovlar" },
                { to: '/posts', label: 'Yangiliklar' },
                { to: '/catalog', label: 'Katalog' },
                { to: '/settings', label: 'Sozlamalar' },
                { to: '/services/new', label: 'Yangi xizmat' },
                { to: '/posts/new', label: 'Yangi yangilik' },
                { to: '/catalog/new', label: 'Yangi mahsulot' },
                { to: '/media', label: 'Media yuklash' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm hover:border-[#2563EB] hover:text-[#2563EB]"
                >
                  {link.label}
                  <ExternalLink size={14} />
                </Link>
              ))}
            </div>
          </div>

          <div className="admin-content-card p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-[var(--admin-text)]">
              <Activity size={18} className="text-[#10B981]" />
              Tizim holati
            </h2>
            <ul className="space-y-2 text-sm text-[var(--admin-text-muted)]">
              <li className="text-xs text-gray-400">
                Build: {import.meta.env.VITE_APP_VERSION ?? 'dev'}
              </li>
              <li className="flex justify-between gap-2">
                <span>Sayt</span>
                <a href="https://acoustic.uz" target="_blank" rel="noreferrer" className="text-[#2563EB]">
                  acoustic.uz ↗
                </a>
              </li>
              <li className="flex justify-between gap-2">
                <span>Admin</span>
                <a href="https://admin.acoustic.uz" target="_blank" rel="noreferrer" className="text-[#2563EB]">
                  admin.acoustic.uz ↗
                </a>
              </li>
              <li className="flex justify-between">
                <span>API</span>
                <span className="font-medium text-[#10B981]">Faol</span>
              </li>
              <li className="flex justify-between">
                <span>Yangi so'rovlar</span>
                <span className="font-medium text-[var(--admin-text)]">{stats.newLeads}</span>
              </li>
              <li className="flex justify-between">
                <span>Kutilayotgan sharhlar</span>
                <span className="font-medium text-[var(--admin-text)]">{stats.pendingReviews}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="admin-content-card">
          <div className="border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="font-semibold">So'nggi yangiliklar</h2>
          </div>
          <ul className="divide-y divide-[var(--admin-border)]">
            {recentPosts.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-[var(--admin-text-muted)]">
                Yangiliklar yo'q
              </li>
            ) : (
              recentPosts.map((post: { id: string; title_uz?: string; status?: string }) => (
                <li key={post.id} className="flex items-center justify-between px-5 py-3">
                  <span className="truncate text-sm">{post.title_uz ?? post.id}</span>
                  <StatusBadge status={post.status ?? 'draft'} />
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="admin-content-card">
          <div className="border-b border-[var(--admin-border)] px-5 py-4">
            <h2 className="font-semibold">So'nggi sharhlar</h2>
          </div>
          <ul className="divide-y divide-[var(--admin-border)]">
            {recentReviews.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-[var(--admin-text-muted)]">
                Sharhlar yo'q
              </li>
            ) : (
              recentReviews.map((review) => (
                <li key={review.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{review.name}</span>
                    <StatusBadge status={review.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--admin-text-muted)]">
                    {review.body}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
