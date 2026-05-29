import { useState } from 'react';
import {
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
  Select,
  Input,
  Card,
  Statistic,
  Row,
  Col,
  Drawer,
  Steps,
  Avatar,
  Divider,
} from 'antd';
import { DeleteOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import PageHeader from '../components/common/PageHeader';
import FilterPanel from '../components/common/FilterPanel';
import ListTable from '../components/common/ListTable';
import { useTableLoading } from '../hooks/useTableLoading';
import StatCard from '../components/common/StatCard';
import { Inbox, CheckCircle, Clock } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getLeads,
  updateLead,
  deleteLead,
  getTelegramButtonStats,
  LeadDto,
  UpdateLeadPayload,
  TelegramButtonStats,
  ApiError,
} from '../lib/api';
import { exportLeadsToCsv } from '../lib/exportLeads';
import dayjs from 'dayjs';

const statusOptions = [
  { label: 'Yangi', value: 'new' },
  { label: 'Ko\'rib chiqilmoqda', value: 'in_progress' },
  { label: 'Yakunlangan', value: 'completed' },
  { label: 'Bekor qilingan', value: 'cancelled' },
];

// Helper function to format source for display
const formatSource = (source: string | null | undefined): string => {
  if (!source) return 'Noma\'lum';
  
  // Format source for better readability
  if (source.startsWith('post-')) {
    return `📝 Maqola: ${source.replace('post-', '')}`;
  }
  if (source.startsWith('service-')) {
    return `🔧 Xizmat: ${source.replace('service-', '')}`;
  }
  if (source.startsWith('product-')) {
    return `🛍️ Mahsulot: ${source.replace('product-', '')}`;
  }
  if (source === 'contact-page') {
    return '📞 Contact sahifa';
  }
  if (source.startsWith('appointment_form')) {
    return '📋 Qabulga yozilish';
  }
  if (source === 'telegram_button_click') {
    return '📱 Telegram tugmasi';
  }
  
  return source;
};

// Helper to format UTM params as display string
const formatUtmParamsStr = (utmParams: Record<string, string> | null | undefined): string => {
  if (!utmParams || Object.keys(utmParams).length === 0) return '';
  const parts: string[] = [];
  if (utmParams.utm_source) parts.push(`source: ${utmParams.utm_source}`);
  if (utmParams.utm_campaign) parts.push(`campaign: ${utmParams.utm_campaign}`);
  if (utmParams.utm_content) parts.push(`content: ${utmParams.utm_content}`);
  if (utmParams.utm_placement) parts.push(`placement: ${utmParams.utm_placement}`);
  return parts.join(' · ');
};

// Helper function to get source color
const getSourceColor = (source: string | null | undefined): string => {
  if (!source) return 'default';
  
  if (source.startsWith('post-')) return 'blue';
  if (source.startsWith('service-')) return 'green';
  if (source.startsWith('product-')) return 'orange';
  if (source === 'contact-page') return 'purple';
  if (source.startsWith('appointment_form')) return 'cyan';
  if (source === 'telegram_button_click') return 'blue';
  
  return 'default';
};

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [sourceFilter, setSourceFilter] = useState<string | undefined>(undefined);
  const [utmFilter, setUtmFilter] = useState<'all' | 'has_utm'>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailLead, setDetailLead] = useState<LeadDto | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data: leads, isLoading, isFetching, isPending, error } = useQuery<LeadDto[], ApiError>({
    queryKey: ['leads'],
    queryFn: getLeads,
  });
  const tableLoading = useTableLoading({ isLoading, isFetching, isPending });

  const { data: telegramStats, isLoading: isLoadingStats } = useQuery<TelegramButtonStats, ApiError>({
    queryKey: ['telegram-button-stats'],
    queryFn: getTelegramButtonStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { mutateAsync: updateLeadMutation, isPending: isUpdating } = useMutation<
    LeadDto,
    ApiError,
    { id: string; payload: UpdateLeadPayload }
  >({
    mutationFn: ({ id, payload }) => updateLead(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      message.success('Lead yangilandi');
    },
    onError: (error) => message.error(error.message || 'Yangilashda xatolik'),
  });

  const { mutateAsync: deleteLeadMutation, isPending: isDeleting } = useMutation<
    void,
    ApiError,
    string
  >({
    mutationFn: deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      message.success('Lead o\'chirildi');
    },
    onError: (error) => message.error(error.message || 'O\'chirishda xatolik'),
  });

  // Filter leads
  const filteredLeads = leads?.filter((lead) => {
    if (statusFilter && lead.status !== statusFilter) return false;
    if (sourceFilter && lead.source !== sourceFilter) return false;
    if (utmFilter === 'has_utm') {
      const hasUtm = lead.utmParams && Object.keys(lead.utmParams).length > 0;
      if (!hasUtm) return false;
    }
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const utmStr = lead.utmParams ? JSON.stringify(lead.utmParams).toLowerCase() : '';
      return (
        lead.name.toLowerCase().includes(searchLower) ||
        lead.phone.includes(searchText) ||
        (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
        (lead.source && lead.source.toLowerCase().includes(searchLower)) ||
        (lead.message && lead.message.toLowerCase().includes(searchLower)) ||
        utmStr.includes(searchLower)
      );
    }
    return true;
  });

  // Get unique sources for filter
  const uniqueSources = Array.from(
    new Set(leads?.map((lead) => lead.source).filter(Boolean) || [])
  );

  const columns: ColumnsType<LeadDto> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: string, record: LeadDto) => (
        <Button type="link" size="small" className="p-0 text-xs" onClick={() => setDetailLead(record)}>
          {id.slice(0, 8)}…
        </Button>
      ),
    },
    {
      title: 'Ism',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (phone: string) => (
        <a href={`tel:${phone}`} className="text-blue-600 hover:underline">
          {phone}
        </a>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email: string | null) =>
        email ? (
          <a href={`mailto:${email}`} className="text-blue-600 hover:underline">
            {email}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      title: 'Manba',
      dataIndex: 'source',
      key: 'source',
      width: 200,
      render: (source: string | null) => (
        <Tag color={getSourceColor(source)}>{formatSource(source)}</Tag>
      ),
    },
    {
      title: 'Reklama (UTM)',
      dataIndex: 'utmParams',
      key: 'utmParams',
      width: 220,
      render: (utmParams: Record<string, string> | null) => {
        const hasUtm = utmParams && Object.keys(utmParams).length > 0;
        const str = formatUtmParamsStr(utmParams);
        return hasUtm ? (
          <Tag color="orange" title={JSON.stringify(utmParams, null, 2)}>
            {str.length > 35 ? `${str.slice(0, 35)}...` : str}
          </Tag>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      title: 'Xabar',
      dataIndex: 'message',
      key: 'message',
      width: 200,
      ellipsis: true,
      render: (message: string | null) =>
        message ? (
          <span title={message} className="text-sm">
            {message.length > 50 ? `${message.slice(0, 50)}...` : message}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      title: 'Holat',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string | null, record: LeadDto) => (
        <Select
          value={status || 'new'}
          onChange={(value) =>
            updateLeadMutation({ id: record.id, payload: { status: value } })
          }
          loading={isUpdating}
          style={{ width: '100%' }}
          size="small"
        >
          {statusOptions.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Yaratilgan',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => {
        const d = new Date(date);
        return (
          <span className="text-sm text-muted-foreground">
            {d.toLocaleDateString('uz-UZ', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        );
      },
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: LeadDto) => (
        <Space>
          <Popconfirm
            title="Lead'ni o'chirishni tasdiqlaysizmi?"
            onConfirm={() => deleteLeadMutation(record.id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              loading={isDeleting}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (error) {
    return (
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>
          So'rovlar
        </h2>
        <p style={{ color: 'red' }}>Xatolik: {error.message}</p>
      </div>
    );
  }

  const totalCount = leads?.length ?? 0;
  const newCount = leads?.filter((l) => l.status === 'new').length ?? 0;
  const completedCount = leads?.filter((l) => l.status === 'completed').length ?? 0;

  return (
    <div>
      <PageHeader
        title="So'rovlar"
        description="Mijozlardan kelgan barcha so'rovlar"
        count={filteredLeads?.length ?? 0}
        loading={tableLoading}
        actions={
          <Space>
            <Button
              icon={<DownloadOutlined />}
              loading={exporting}
              onClick={() => {
                setExporting(true);
                try {
                  exportLeadsToCsv(filteredLeads ?? []);
                  message.success('Excel fayl yuklab olindi');
                } finally {
                  setExporting(false);
                }
              }}
            >
              Excel yuklash
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['leads'] });
                queryClient.invalidateQueries({ queryKey: ['telegram-button-stats'] });
              }}
              loading={isLoading}
            >
              Yangilash
            </Button>
          </Space>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Inbox size={20} />} title="Jami" value={totalCount} />
        <StatCard icon={<Clock size={20} />} title="Yangi" value={newCount} />
        <StatCard icon={<CheckCircle size={20} />} title="Javob berilgan" value={completedCount} />
      </div>

      {/* Telegram Button Statistics */}
      {telegramStats && (
        <Card style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            📱 Telegram Tugmasi Statistika
          </h3>
          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Jami bosilgan"
                value={telegramStats.total}
                loading={isLoadingStats}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Bugun"
                value={telegramStats.today}
                loading={isLoadingStats}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Bu hafta"
                value={telegramStats.thisWeek}
                loading={isLoadingStats}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Bu oy"
                value={telegramStats.thisMonth}
                loading={isLoadingStats}
              />
            </Col>
          </Row>
        </Card>
      )}

      <FilterPanel
        onClear={() => {
          setSearchText('');
          setStatusFilter(undefined);
          setSourceFilter(undefined);
          setUtmFilter('all');
        }}
      >
        <Input
          placeholder="Qidirish (ism, telefon, email, manba, xabar)"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="min-w-[280px] flex-1"
          size="large"
          allowClear
        />
        <Select
          placeholder="Holat"
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          className="min-w-[160px]"
        >
          {statusOptions.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder="Manba"
          value={sourceFilter}
          onChange={setSourceFilter}
          allowClear
          className="min-w-[200px]"
        >
          {uniqueSources.map((source) => (
            <Select.Option key={source} value={source}>
              {formatSource(source)}
            </Select.Option>
          ))}
        </Select>
        <Select value={utmFilter} onChange={setUtmFilter} className="min-w-[180px]">
          <Select.Option value="all">Barcha leadlar</Select.Option>
          <Select.Option value="has_utm">Reklama orqali</Select.Option>
        </Select>
      </FilterPanel>

      {selectedRowKeys.length > 0 && (
        <div className="sticky top-16 z-10 mb-4 flex items-center gap-3 rounded-xl border border-[var(--admin-border)] bg-white px-4 py-3 shadow-md dark:bg-[#1e293b]">
          <span className="text-sm font-medium">{selectedRowKeys.length} ta tanlandi</span>
          <Button
            size="small"
            onClick={() => {
              Promise.all(
                selectedRowKeys.map((id) =>
                  updateLeadMutation({ id: String(id), payload: { status: 'in_progress' } }),
                ),
              ).then(() => {
                setSelectedRowKeys([]);
                message.success("Ko'rildi deb belgilandi");
              });
            }}
          >
            Ko&apos;rildi deb belgilash
          </Button>
          <Popconfirm
            title={`${selectedRowKeys.length} ta so'rovni o'chirish?`}
            onConfirm={() => {
              Promise.all(selectedRowKeys.map((id) => deleteLeadMutation(String(id)))).then(() =>
                setSelectedRowKeys([]),
              );
            }}
          >
            <Button size="small" danger>
              O&apos;chirish
            </Button>
          </Popconfirm>
        </div>
      )}

      <ListTable
        columns={columns}
        dataSource={filteredLeads}
        loading={tableLoading}
        scroll={{ x: 1400 }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
      />

      <Drawer
        title="So'rov tafsilotlari"
        width={480}
        open={Boolean(detailLead)}
        onClose={() => setDetailLead(null)}
      >
        {detailLead && (
          <div className="flex flex-col gap-4">
            <Card size="small" title="Mijoz ma'lumotlari">
              <div className="flex items-center gap-3">
                <Avatar>{detailLead.name?.[0]?.toUpperCase()}</Avatar>
                <div>
                  <p className="font-semibold">{detailLead.name}</p>
                  <a href={`tel:${detailLead.phone}`} className="text-[#2563EB]">
                    📞 {detailLead.phone}
                  </a>
                  {detailLead.email && (
                    <p>
                      <a href={`mailto:${detailLead.email}`}>✉️ {detailLead.email}</a>
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    📅 {dayjs(detailLead.createdAt).format('DD.MM.YYYY HH:mm')}
                  </p>
                  <Tag color={getSourceColor(detailLead.source)}>{formatSource(detailLead.source)}</Tag>
                </div>
              </div>
            </Card>
            <Card size="small" title="Holat boshqaruvi">
              <Steps
                direction="vertical"
                size="small"
                current={Math.max(
                  0,
                  ['new', 'in_progress', 'completed', 'cancelled'].indexOf(detailLead.status ?? 'new'),
                )}
                items={[
                  { title: 'Yangi' },
                  { title: "Ko'rildi" },
                  { title: 'Javob berildi' },
                  { title: 'Rad etildi' },
                ]}
              />
              <Divider />
              <Select
                className="mb-3 w-full"
                value={detailLead.status ?? 'new'}
                onChange={(v) => {
                  updateLeadMutation({ id: detailLead.id, payload: { status: v } }).then((updated) =>
                    setDetailLead(updated),
                  );
                }}
                options={statusOptions}
              />
              {detailLead.message && <p className="text-sm text-gray-600">{detailLead.message}</p>}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}

