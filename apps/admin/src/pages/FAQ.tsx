import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Collapse,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../components/common/PageHeader';
import FilterPanel from '../components/common/FilterPanel';
import ListTable from '../components/common/ListTable';
import TableActions from '../components/common/TableActions';
import StatusTag from '../components/common/StatusTag';
import LangTabs from '../components/common/LangTabs';
import { useTableLoading } from '../hooks/useTableLoading';
import {
  getFaqsAdmin,
  createFaq,
  updateFaq,
  deleteFaq,
  type FaqDto,
  type CreateFaqPayload,
  type UpdateFaqPayload,
  ApiError,
} from '../lib/api';

const statusOptions = [
  { label: 'Barchasi', value: '' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
];

function truncate(text: string, len = 80) {
  return text.length > len ? `${text.slice(0, len)}…` : text;
}

export default function FAQPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: faqs, isLoading, isFetching, isPending } = useQuery<FaqDto[], ApiError>({
    queryKey: ['faqs-admin'],
    queryFn: getFaqsAdmin,
  });
  const tableLoading = useTableLoading({ isLoading, isFetching, isPending });

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqDto | null>(null);
  const [form] = Form.useForm();

  const { mutateAsync: createMutation, isPending: isCreating } = useMutation<FaqDto, ApiError, CreateFaqPayload>({
    mutationFn: createFaq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs-admin'] });
      message.success('Savol-javob saqlandi');
    },
    onError: (error) => message.error(error.message || 'Saqlashda xatolik'),
  });

  const { mutateAsync: updateMutation, isPending: isUpdating } = useMutation<
    FaqDto,
    ApiError,
    { id: string; payload: UpdateFaqPayload }
  >({
    mutationFn: ({ id, payload }) => updateFaq(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs-admin'] });
      message.success('Savol-javob yangilandi');
    },
    onError: (error) => message.error(error.message || 'Yangilashda xatolik'),
  });

  const { mutateAsync: deleteMutation, isPending: isDeleting } = useMutation<void, ApiError, string>({
    mutationFn: deleteFaq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs-admin'] });
      message.success("Savol-javob o'chirildi");
    },
    onError: (error) => message.error(error.message || "O'chirishda xatolik"),
  });

  const filtered = useMemo(() => {
    return (faqs ?? []).filter((f) => {
      if (statusFilter && f.status !== statusFilter) return false;
      if (!searchText.trim()) return true;
      const q = searchText.toLowerCase();
      return f.question_uz.toLowerCase().includes(q) || f.question_ru.toLowerCase().includes(q);
    });
  }, [faqs, searchText, statusFilter]);

  const publishedFaqs = useMemo(
    () => (faqs ?? []).filter((f) => f.status === 'published').sort((a, b) => a.order - b.order),
    [faqs],
  );

  const openCreateModal = () => {
    setEditingFaq(null);
    form.resetFields();
    form.setFieldsValue({ status: 'published', order: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (faq: FaqDto) => {
    setEditingFaq(faq);
    form.setFieldsValue({
      question_uz: faq.question_uz,
      question_ru: faq.question_ru,
      answer_uz: faq.answer_uz,
      answer_ru: faq.answer_ru,
      order: faq.order,
      status: faq.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload: CreateFaqPayload = {
      question_uz: values.question_uz,
      question_ru: values.question_ru,
      answer_uz: values.answer_uz,
      answer_ru: values.answer_ru,
      order: values.order ?? 0,
      status: values.status ?? 'published',
    };
    if (editingFaq) {
      await updateMutation({ id: editingFaq.id, payload });
    } else {
      await createMutation(payload);
    }
    setIsModalOpen(false);
    form.resetFields();
  };

  const columns: ColumnsType<FaqDto> = useMemo(
    () => [
      {
        title: 'Savol (uz)',
        dataIndex: 'question_uz',
        key: 'question_uz',
        render: (v: string) => <span title={v}>{truncate(v)}</span>,
      },
      {
        title: 'Savol (ru)',
        dataIndex: 'question_ru',
        key: 'question_ru',
        render: (v: string) => <span title={v}>{truncate(v)}</span>,
      },
      { title: 'Tartib', dataIndex: 'order', key: 'order', width: 80 },
      {
        title: 'Holat',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (s: string) => <StatusTag status={s} />,
      },
      {
        title: 'Amallar',
        key: 'actions',
        width: 100,
        fixed: 'right',
        render: (_, record) => (
          <TableActions
            onEdit={() => navigate(`/faq/${record.id}/edit`)}
            onDelete={() => deleteMutation(record.id)}
            loading={isDeleting}
          />
        ),
      },
    ],
    [isDeleting, deleteMutation],
  );

  return (
    <div>
      <PageHeader
        title="Savol-Javob"
        description="Tez-tez beriladigan savollar"
        count={filtered.length}
        loading={tableLoading}
        action={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/faq/new')}>
            Yangi savol
          </Button>
        }
      />

      {showPreview && publishedFaqs.length > 0 && (
        <div className="admin-content-card mb-6 p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--admin-text)]">Saytda ko'rinishi (preview)</h3>
          <Collapse
            items={publishedFaqs.map((f) => ({
              key: f.id,
              label: f.question_uz,
              children: <p className="whitespace-pre-wrap text-sm text-[var(--admin-text-muted)]">{f.answer_uz}</p>,
            }))}
          />
        </div>
      )}

      <div className="mb-4">
        <Button type="link" onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? 'Preview yashirish' : 'FAQ ni preview qilish'}
        </Button>
      </div>

      <FilterPanel
        onClear={() => {
          setSearchText('');
          setStatusFilter('');
        }}
      >
        <Input
          placeholder="Savol bo'yicha qidirish..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          size="large"
          className="min-w-[240px] flex-1"
        />
        <Select
          placeholder="Holat"
          value={statusFilter || undefined}
          onChange={(v) => setStatusFilter(v ?? '')}
          allowClear
          options={statusOptions.filter((o) => o.value !== '')}
          className="min-w-[140px]"
        />
      </FilterPanel>

      <ListTable loading={tableLoading} dataSource={filtered} columns={columns} />

      <Modal
        title={editingFaq ? 'Savol-javobni tahrirlash' : 'Yangi savol-javob'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={isCreating || isUpdating}
        width={720}
        okText="Saqlash"
        cancelText="Bekor qilish"
      >
        <Form layout="vertical" form={form}>
          <LangTabs>
            {(lang) =>
              lang === 'uz' ? (
                <>
                  <Form.Item label="Savol" name="question_uz" rules={[{ required: true }]}>
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item label="Javob" name="answer_uz" rules={[{ required: true }]}>
                    <Input.TextArea rows={4} />
                  </Form.Item>
                </>
              ) : (
                <>
                  <Form.Item label="Savol" name="question_ru" rules={[{ required: true }]}>
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item label="Javob" name="answer_ru" rules={[{ required: true }]}>
                    <Input.TextArea rows={4} />
                  </Form.Item>
                </>
              )
            }
          </LangTabs>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Form.Item label="Tartib" name="order">
              <InputNumber className="w-full" min={0} />
            </Form.Item>
            <Form.Item label="Holat" name="status">
              <Select
                options={[
                  { label: 'Published', value: 'published' },
                  { label: 'Draft', value: 'draft' },
                  { label: 'Archived', value: 'archived' },
                ]}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
