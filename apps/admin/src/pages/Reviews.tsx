import { useMemo, useState } from 'react';
import { Alert, Button, Drawer, Form, Input, Rate, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import PageHeader from '../components/common/PageHeader';
import ListTable from '../components/common/ListTable';
import StatCard from '../components/common/StatCard';
import StatusTag from '../components/common/StatusTag';
import TableActions from '../components/common/TableActions';
import type { ReviewDto } from '../lib/api';
import { useDeleteReview, useReviewsAdmin, useUpdateReview } from '../hooks/useReviews';
import { useTableLoading } from '../hooks/useTableLoading';

const statusOptions = [
  { value: 'published', label: 'Chop etilgan' },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'rejected', label: 'Rad etilgan' },
];

export default function ReviewsPage() {
  const { data, isLoading, isFetching, isPending, isError, error, refetch } = useReviewsAdmin();
  const tableLoading = useTableLoading({ isLoading, isFetching, isPending });
  const { mutateAsync: saveReview, isPending: saving } = useUpdateReview();
  const { mutateAsync: removeReview, isPending: deleting } = useDeleteReview();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ReviewDto | null>(null);
  const [form] = Form.useForm();

  const openEditDrawer = (record: ReviewDto) => {
    setEditing(record);
    form.setFieldsValue({
      authorName: record.name,
      rating: record.rating,
      textUz: record.body,
      textRu: record.body,
      status: record.status,
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    const v = await form.validateFields();
    await saveReview({
      id: editing.id,
      payload: {
        name: v.authorName,
        rating: v.rating,
        body: v.textUz,
        status: v.status,
      },
    });
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await removeReview(id);
  };

  const stats = useMemo(() => {
    const list = data ?? [];
    const pending = list.filter((r) => r.status === 'pending').length;
    const avg =
      list.length > 0 ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : '0';
    return { total: list.length, pending, avg };
  }, [data]);

  const columns: ColumnsType<ReviewDto> = useMemo(
    () => [
      {
        title: 'MUALLIF',
        dataIndex: 'name',
        key: 'authorName',
        width: 160,
        ellipsis: true,
        render: (name: string) => <span className="font-medium">{name}</span>,
      },
      {
        title: 'BAHO',
        dataIndex: 'rating',
        key: 'rating',
        width: 140,
        render: (r: number) => (
          <Rate disabled value={r} count={5} style={{ whiteSpace: 'nowrap', fontSize: 12 }} />
        ),
      },
      {
        title: 'MATN',
        dataIndex: 'body',
        key: 'textUz',
        render: (text: string) => (
          <span className="block max-w-[200px] truncate" title={text}>
            {text?.length > 80 ? `${text.slice(0, 80)}…` : text}
          </span>
        ),
      },
      {
        title: 'HOLAT',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        render: (s: string) => <StatusTag status={s} />,
      },
      {
        title: 'SANA',
        dataIndex: 'createdAt',
        width: 110,
        render: (date: string) => (date ? dayjs(date).format('DD.MM.YYYY') : '—'),
      },
      {
        title: 'AMALLAR',
        key: 'actions',
        width: 90,
        fixed: 'right',
        render: (_, record) => (
          <TableActions
            onEdit={() => openEditDrawer(record)}
            onDelete={() => handleDelete(record.id)}
            loading={deleting}
          />
        ),
      },
    ],
    [deleting],
  );

  if (isError) {
    return (
      <div>
        <PageHeader title="Sharhlar" />
        <Alert
          type="error"
          message="Ma'lumot yuklanmadi"
          description={error?.message}
          action={
            <Button size="small" onClick={() => refetch()}>
              Qayta urinish
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Sharhlar"
        description="Mijozlar fikrlarini moderatsiya qiling"
        count={stats.total}
        loading={tableLoading}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<span>📊</span>} title="Jami" value={stats.total} />
        <StatCard icon={<span>⭐</span>} title="O'rtacha baho" value={stats.avg} />
        <StatCard icon={<span>⏳</span>} title="Kutilmoqda" value={stats.pending} />
      </div>

      <ListTable rowKey="id" loading={tableLoading} columns={columns} dataSource={data ?? []} scroll={{ x: 900 }} />

      <Drawer
        title="Sharhni tahrirlash"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        width={480}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="authorName" label="Muallif" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="rating" label="Baho" rules={[{ required: true }]}>
            <Rate />
          </Form.Item>
          <Form.Item name="textUz" label="Matn (UZ)" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="textRu" label="Matn (RU)">
            <Input.TextArea rows={4} placeholder="Ixtiyoriy — hozir UZ matn bilan bir xil saqlanadi" />
          </Form.Item>
          <Form.Item name="status" label="Holat" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving} block>
            Saqlash
          </Button>
        </Form>
      </Drawer>
    </div>
  );
}
