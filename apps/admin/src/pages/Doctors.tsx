import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTableLoading } from '../hooks/useTableLoading';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Popconfirm,
  message,
  Upload,
  Image,
} from 'antd';
import { UploadOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import PageHeader from '../components/common/PageHeader';
import FilterPanel from '../components/common/FilterPanel';
import ListTable from '../components/common/ListTable';
import TableActions from '../components/common/TableActions';
import StatusTag from '../components/common/StatusTag';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  DoctorDto,
  CreateDoctorPayload,
  UpdateDoctorPayload,
  ApiError,
  getMedia,
  uploadMedia,
  getBranches,
  type MediaDto,
  type BranchDto,
} from '../lib/api';
import { createSlug } from '../utils/slug';
import ImageSizeHint from '../components/ImageSizeHint';
import { normalizeImageUrl } from '../utils/image';
import { compressImage } from '../utils/image-compression';

const statusOptions = [
  { label: 'Nashr etilgan', value: 'published' },
  { label: 'Qoralama', value: 'draft' },
  { label: 'Arxiv', value: 'archived' },
];

export default function DoctorsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, isPending } = useQuery<DoctorDto[], ApiError>({
    queryKey: ['doctors'],
    queryFn: getDoctors,
    retry: false,
  });
  const tableLoading = useTableLoading({ isLoading, isFetching, isPending });

  // Fetch media list for image selection
  const { data: mediaList } = useQuery<MediaDto[], ApiError>({
    queryKey: ['media'],
    queryFn: getMedia,
    retry: false,
  });

  const { data: branches } = useQuery<BranchDto[], ApiError>({
    queryKey: ['branches'],
    queryFn: getBranches,
    retry: false,
  });

  const branchOptions = useMemo(
    () =>
      (branches ?? []).map((b) => ({
        value: b.id,
        label: b.name_ru ? `${b.name_uz} / ${b.name_ru}` : b.name_uz,
      })),
    [branches],
  );

  const branchNameById = useMemo(() => {
    const m = new Map<string, string>();
    (branches ?? []).forEach((b) => m.set(b.id, b.name_uz));
    return m;
  }, [branches]);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [branchFilter, setBranchFilter] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorDto | null>(null);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { mutateAsync: createDoctorMutation, isPending: isCreating } = useMutation<DoctorDto, ApiError, CreateDoctorPayload>({
    mutationFn: createDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      message.success('Mutaxassis saqlandi');
    },
    onError: (error) => message.error(error.message || 'Saqlashda xatolik'),
  });

  const { mutateAsync: updateDoctorMutation, isPending: isUpdating } = useMutation<DoctorDto, ApiError, { id: string; payload: UpdateDoctorPayload }>({
    mutationFn: ({ id, payload }) => updateDoctor(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      message.success('Mutaxassis yangilandi');
    },
    onError: (error) => message.error(error.message || 'Yangilashda xatolik'),
  });

  const { mutateAsync: deleteDoctorMutation, isPending: isDeleting } = useMutation<void, ApiError, string>({
    mutationFn: deleteDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      message.success('Mutaxassis o\'chirildi');
    },
    onError: (error) => message.error(error.message || 'O\'chirishda xatolik'),
  });

  const openCreateModal = () => {
    setEditingDoctor(null);
    form.resetFields();
    setPreviewImage(null);
    form.setFieldsValue({
      status: 'published',
      order: 0,
      branchIds: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (doctor: DoctorDto) => {
    setEditingDoctor(doctor);
    setPreviewImage(doctor.image?.url ? normalizeImageUrl(doctor.image.url) : null);
    form.setFieldsValue({
      name_uz: doctor.name_uz,
      name_ru: doctor.name_ru,
      position_uz: doctor.position_uz,
      position_ru: doctor.position_ru,
      experience_uz: doctor.experience_uz,
      experience_ru: doctor.experience_ru,
      description_uz: doctor.description_uz,
      description_ru: doctor.description_ru,
      slug: doctor.slug,
      status: doctor.status,
      order: doctor.order,
      imageId: doctor.image?.id,
      branchIds: doctor.branchIds?.length ? [...doctor.branchIds] : [],
    });
    setIsModalOpen(true);
  };

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    try {
      // Rasmni yuklashdan oldin siqish
      const compressedFile = await compressImage(file as File);
      const media = await uploadMedia(compressedFile);
      form.setFieldsValue({ imageId: media.id });
      setPreviewImage(normalizeImageUrl(media.url));
      message.success('Rasm yuklandi');
      queryClient.invalidateQueries({ queryKey: ['media'] });
      onSuccess?.(media);
    } catch (error) {
      const apiError = error as ApiError;
      message.error(apiError.message || 'Rasm yuklashda xatolik');
      onError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    form.setFieldsValue({ imageId: undefined });
    setPreviewImage(null);
  };

  const handleSelectExistingMedia = (mediaId: string, mediaUrl: string) => {
    form.setFieldsValue({ imageId: mediaId });
    setPreviewImage(normalizeImageUrl(mediaUrl));
  };

  const currentImageId = Form.useWatch('imageId', form);

  const handleDelete = async (doctor: DoctorDto) => {
    await deleteDoctorMutation(doctor.id);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: CreateDoctorPayload = {
        name_uz: values.name_uz,
        name_ru: values.name_ru,
        position_uz: values.position_uz ?? undefined,
        position_ru: values.position_ru ?? undefined,
        experience_uz: values.experience_uz ?? undefined,
        experience_ru: values.experience_ru ?? undefined,
        description_uz: values.description_uz ?? undefined,
        description_ru: values.description_ru ?? undefined,
        slug: values.slug,
        order: typeof values.order === 'number' ? values.order : Number(values.order ?? 0),
        status: values.status,
        imageId: values.imageId || undefined,
        branchIds: Array.isArray(values.branchIds) ? values.branchIds : [],
      };

      if (editingDoctor) {
        await updateDoctorMutation({ id: editingDoctor.id, payload });
      } else {
        await createDoctorMutation(payload);
      }

      setIsModalOpen(false);
      form.resetFields();
      setPreviewImage(null);
    } catch (error) {
      // validation handled by antd
    }
  };

  const columns: ColumnsType<DoctorDto> = useMemo(
    () => [
      {
        title: 'Mutaxassis',
        dataIndex: 'name_uz',
        key: 'name_uz',
        render: (value: string, record) => (
          <Space align="start">
            {record.image?.url ? (
              <img
                src={normalizeImageUrl(record.image.url)}
                alt={record.name_uz}
                style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }}
              />
            ) : null}
            <div>
              <strong>{value}</strong>
              {record.name_ru ? (
                <div style={{ fontSize: 12, color: '#6b7280' }}>{record.name_ru}</div>
              ) : null}
              {record.position_uz && (
                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                  {record.position_uz}
                </div>
              )}
            </div>
          </Space>
        ),
      },
      {
        title: 'Holati',
        dataIndex: 'status',
        key: 'status',
        render: (value: DoctorDto['status']) => <StatusTag status={value} />,
      },
      {
        title: 'Filiallar',
        key: 'branchIds',
        render: (_: unknown, record: DoctorDto) => {
          const ids = record.branchIds ?? [];
          if (ids.length === 0) return <span style={{ color: '#9ca3af' }}>—</span>;
          return <Tag>{ids.length} ta filial</Tag>;
        },
      },
      {
        title: 'Tartib',
        dataIndex: 'order',
        key: 'order',
      },
      {
        title: 'Yangilangan',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        render: (value: string) => new Date(value).toLocaleDateString(),
      },
      {
        title: 'Amallar',
        key: 'actions',
        width: 100,
        fixed: 'right' as const,
        render: (_, record) => (
          <TableActions onEdit={() => navigate(`/doctors/${record.id}/edit`)} onDelete={() => handleDelete(record)} loading={isDeleting} />
        ),
      },
    ],
    [isDeleting, branchNameById],
  );

  const filtered = useMemo(() => {
    return (data ?? []).filter((d) => {
      if (statusFilter && d.status !== statusFilter) return false;
      if (branchFilter && !(d.branchIds ?? []).includes(branchFilter)) return false;
      if (!searchText.trim()) return true;
      const q = searchText.toLowerCase();
      return d.name_uz.toLowerCase().includes(q) || (d.name_ru?.toLowerCase().includes(q) ?? false);
    });
  }, [data, searchText, statusFilter, branchFilter]);

  const statusOptions = [
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
    { label: 'Archived', value: 'archived' },
  ];

  return (
    <div>
      <PageHeader
        title="Mutaxassislar"
        description="Shifokorlar va audiologlar"
        count={filtered.length}
        loading={tableLoading}
        action={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/doctors/new')}>Yangi mutaxassis</Button>}
      />
      <FilterPanel onClear={() => { setSearchText(''); setStatusFilter(undefined); setBranchFilter(undefined); }}>
        <Input placeholder="Ism bo'yicha qidirish..." value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear size="large" className="min-w-[240px] flex-1" />
        <Select placeholder="Holat" allowClear value={statusFilter} onChange={setStatusFilter} options={statusOptions} className="min-w-[140px]" />
        <Select placeholder="Filial" allowClear value={branchFilter} onChange={setBranchFilter} options={(branches ?? []).map((b) => ({ label: b.name_uz, value: b.id }))} className="min-w-[180px]" />
      </FilterPanel>
      <ListTable columns={columns} dataSource={filtered} loading={tableLoading} />
      <Modal
        title={editingDoctor ? 'Mutaxassisni tahrirlash' : 'Yangi mutaxassis'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setPreviewImage(null);
        }}
        onOk={handleSubmit}
        confirmLoading={isCreating || isUpdating}
        width={800}
        okText="Saqlash"
        cancelText="Bekor qilish"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Ism (uz)"
            name="name_uz"
            rules={[{ required: true, message: 'Iltimos ismni kiriting' }]}
          >
            <Input
              placeholder="Masalan, Ahmadjon Aliyev"
              onChange={(e) => {
                const name = e.target.value;
                const currentSlug = form.getFieldValue('slug');
                // Only auto-generate slug if it's empty or was auto-generated
                if (!currentSlug || currentSlug === createSlug(form.getFieldValue('name_uz') || '')) {
                  form.setFieldsValue({ slug: createSlug(name) });
                }
              }}
            />
          </Form.Item>
          <Form.Item
            label="Ism (ru)"
            name="name_ru"
            rules={[{ required: true, message: 'Iltimos ismni kiriting' }]}
          >
            <Input placeholder="Например, Ахмаджон Алиев" />
          </Form.Item>
          <Form.Item label="Lavozim (uz)" name="position_uz">
            <Input placeholder="Masalan, Bosh surdolog" />
          </Form.Item>
          <Form.Item label="Lavozim (ru)" name="position_ru">
            <Input placeholder="Например, Главный сурдолог" />
          </Form.Item>
          <Form.Item label="Tajriba (uz)" name="experience_uz">
            <Input placeholder="Masalan, 10 yillik tajriba" />
          </Form.Item>
          <Form.Item label="Tajriba (ru)" name="experience_ru">
            <Input placeholder="Например, 10 лет опыта" />
          </Form.Item>
          <Form.Item label="Tavsif (uz)" name="description_uz">
            <Input.TextArea rows={4} placeholder="Mutaxassis haqida batafsil ma'lumot" />
          </Form.Item>
          <Form.Item label="Tavsif (ru)" name="description_ru">
            <Input.TextArea rows={4} placeholder="Подробная информация о специалисте" />
          </Form.Item>
          <Form.Item
            label="Slug"
            name="slug"
            rules={[{ required: true, message: 'Slug maydoni majburiy' }]}
            extra="URL uchun qisqa nom (avtomatik yaratiladi yoki qo'lda kiriting)"
          >
            <Input placeholder="Avtomatik yaratiladi..." />
          </Form.Item>
          <Form.Item
            label="Filiallar"
            name="branchIds"
            extra="Qaysi filial sahifalarida «Shifokorlar» bo‘limida ko‘rsatiladi. Hech narsa tanlanmasa, filial sahifalarida chiqmaydi (bosh sahifadagi ro‘yxatga ta’sir qilmaydi)."
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Filial(lar)ni tanlang"
              options={branchOptions}
              optionFilterProp="label"
            />
          </Form.Item>
          <ImageSizeHint type="doctor" />
          <Form.Item label="Rasm" name="imageId" extra="Mutaxassis rasmi">
            <div>
              {previewImage ? (
                <div style={{ marginBottom: 16, position: 'relative', display: 'inline-block' }}>
                  <Image
                    src={previewImage}
                    alt="Preview"
                    width={200}
                    height={200}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                    preview={false}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveImage}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    O'chirish
                  </Button>
                </div>
              ) : null}
              <Upload
                customRequest={handleUpload}
                showUploadList={false}
                accept="image/*"
                disabled={uploading}
              >
                <Button icon={<UploadOutlined />} loading={uploading}>
                  {previewImage ? 'Rasmni almashtirish' : 'Rasm yuklash'}
                </Button>
              </Upload>
              {mediaList && mediaList.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>
                    Yoki mavjud rasmni tanlang:
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                      gap: 8,
                      maxHeight: 200,
                      overflowY: 'auto',
                      padding: 8,
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                    }}
                  >
                    {mediaList.slice(0, 20).map((media) => (
                      <div
                        key={media.id}
                        onClick={() => handleSelectExistingMedia(media.id, media.url)}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          border: currentImageId === media.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                          borderRadius: 4,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          position: 'relative',
                          backgroundColor: currentImageId === media.id ? '#e6f7ff' : '#fff',
                        }}
                      >
                        <img
                          src={normalizeImageUrl(media.url)}
                          alt={media.alt_uz || media.filename}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Form.Item>
          <Form.Item label="Tartib" name="order" initialValue={0}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Holat" name="status" initialValue="published">
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
