import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import FilterPanel from '../components/common/FilterPanel';
import ListTable from '../components/common/ListTable';
import SortableTable from '../components/common/SortableTable';
import { applyOrderUpdates } from '../lib/reorder';
import { updateService } from '../lib/api';
import TableActions from '../components/common/TableActions';
import StatusTag from '../components/common/StatusTag';
import ModernTabs from '../components/common/ModernTabs';
import {
  getServices,
  deleteService,
  ServiceDto,
  ApiError,
} from '../lib/api';
import ServiceCategoriesPage from './ServiceCategories';
import { normalizeImageUrl } from '../utils/image';
import { useTableLoading } from '../hooks/useTableLoading';

const statusOptions = [
  { label: 'Nashr etilgan', value: 'published' },
  { label: 'Qoralama', value: 'draft' },
  { label: 'Arxiv', value: 'archived' },
];

export default function ServicesPage() {
  return (
    <div>
      <PageHeader title="Xizmatlar" description="Tibbiy xizmatlar va kategoriyalar" />
      <ModernTabs
        defaultActiveKey="services"
        items={[
          { key: 'services', label: 'Xizmatlar', children: <ServicesManager /> },
          { key: 'categories', label: 'Kategoriyalar', children: <ServiceCategoriesPage /> },
        ]}
      />
    </div>
  );
}

function ServicesManager() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, isPending } = useQuery<ServiceDto[], ApiError>({
    queryKey: ['services'],
    queryFn: getServices,
    retry: false,
  });
  const tableLoading = useTableLoading({ isLoading, isFetching, isPending });

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [reordering, setReordering] = useState(false);

  const handleReorder = async (orderedIds: string[]) => {
    setReordering(true);
    try {
      await applyOrderUpdates(orderedIds, (id, order) => updateService(id, { order }));
      queryClient.invalidateQueries({ queryKey: ['services'] });
      message.success('Tartib yangilandi');
    } catch (e) {
      message.error((e as ApiError).message || 'Tartibni saqlashda xatolik');
    } finally {
      setReordering(false);
    }
  };

  const { mutateAsync: deleteServiceMutation, isPending: isDeleting } = useMutation<void, ApiError, string>({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      message.success('Xizmat o‘chirildi');
    },
    onError: (error) => message.error(error.message || "O'chirishda xatolik"),
  });

  const handleDelete = async (service: ServiceDto) => {
    await deleteServiceMutation(service.id);
  };

  const columns: ColumnsType<ServiceDto> = useMemo(
    () => [
      {
        title: 'Xizmat',
        dataIndex: 'title_uz',
        key: 'title_uz',
        render: (value: string, record) => (
          <div className="flex min-w-0 items-start gap-3">
            {record.cover?.url ? (
              <img
                src={normalizeImageUrl(record.cover.url)}
                alt={record.title_uz}
                className="h-14 w-[72px] shrink-0 rounded-lg object-cover"
              />
            ) : null}
            <div className="min-w-0">
              <strong className="block truncate">{value}</strong>
              {record.title_ru ? (
                <div className="truncate text-xs text-gray-500">{record.title_ru}</div>
              ) : null}
              {record.category?.name_uz && (
                <div className="text-xs text-gray-400">Kategoriya: {record.category.name_uz}</div>
              )}
            </div>
          </div>
        ),
      },
      {
        title: 'Holati',
        dataIndex: 'status',
        key: 'status',
        responsive: ['md'],
        render: (value: ServiceDto['status']) => <StatusTag status={value} />,
      },
      {
        title: 'Tartib',
        dataIndex: 'order',
        key: 'order',
        responsive: ['md'],
      },
      {
        title: 'Yangilangan',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        responsive: ['lg'],
        render: (value: string) => new Date(value).toLocaleDateString(),
      },
      {
        title: 'Amallar',
        key: 'actions',
        width: 100,
        fixed: 'right' as const,
        render: (_, record) => (
          <TableActions
            onEdit={() => navigate(`/services/${record.id}/edit`)}
            onDelete={() => handleDelete(record)}
            loading={isDeleting}
          />
        ),
      },
    ],
    [isDeleting, navigate],
  );

  const filtered = useMemo(() => {
    return (data ?? []).filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (!searchText.trim()) return true;
      const q = searchText.toLowerCase();
      return s.title_uz.toLowerCase().includes(q) || (s.title_ru?.toLowerCase().includes(q) ?? false);
    });
  }, [data, searchText, statusFilter]);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/services/new')}>
          Yangi xizmat
        </Button>
      </div>

      <FilterPanel onClear={() => { setSearchText(''); setStatusFilter(undefined); }}>
        <Input
          placeholder="Xizmat nomi..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          size="large"
          className="min-w-[240px] flex-1"
        />
        <Select
          placeholder="Holat"
          allowClear
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          className="min-w-[140px]"
        />
      </FilterPanel>

      {!searchText && !statusFilter ? (
        <SortableTable
          loading={tableLoading}
          reordering={reordering}
          dataSource={[...(filtered ?? [])].sort((a, b) => a.order - b.order)}
          columns={columns}
          rowKey="id"
          onReorder={handleReorder}
        />
      ) : (
        <ListTable loading={tableLoading} dataSource={filtered} columns={columns} rowKey="id" />
      )}
    </div>
  );
}
