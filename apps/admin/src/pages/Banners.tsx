import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Tag,
  Alert,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Popconfirm,
  message,
  Upload,
  Image,
  Row,
  Col,
} from 'antd';
import { UploadOutlined, DeleteOutlined, FolderOutlined, PlusOutlined } from '@ant-design/icons';
import PageHeader from '../components/common/PageHeader';
import FilterPanel from '../components/common/FilterPanel';
import ListTable from '../components/common/ListTable';
import SortableTable from '../components/common/SortableTable';
import { applyOrderUpdates } from '../lib/reorder';
import TableActions from '../components/common/TableActions';
import StatusTag from '../components/common/StatusTag';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createBanner,
  updateBanner,
  getMedia,
  uploadMedia,
  type BannerDto,
  type CreateBannerPayload,
  type UpdateBannerPayload,
  type MediaDto,
  ApiError,
} from '../lib/api';
import { useBanners, useDeleteBanner } from '../hooks/useBanners';
import { useTableLoading } from '../hooks/useTableLoading';
import MediaLibraryModal from '../components/MediaLibraryModal';
import ImageSizeHint from '../components/ImageSizeHint';
import { normalizeImageUrl } from '../utils/image';
import { compressImage } from '../utils/image-compression';

const statusOptions = [
  { label: 'Nashr etilgan', value: 'published' },
  { label: 'Qoralama', value: 'draft' },
  { label: 'Arxiv', value: 'archived' },
];

export default function BannersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: banners, isLoading, isFetching, isPending, isError, error, refetch } = useBanners();
  const tableLoading = useTableLoading({ isLoading, isFetching, isPending });
  const { mutateAsync: deleteMutation, isPending: isDeleting } = useDeleteBanner();

  const { data: mediaList } = useQuery<MediaDto[], ApiError>({
    queryKey: ['media'],
    queryFn: getMedia,
  });

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [reordering, setReordering] = useState(false);

  const handleReorder = async (orderedIds: string[]) => {
    setReordering(true);
    try {
      await applyOrderUpdates(orderedIds, (id, order) => updateBanner(id, { order }));
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      message.success('Tartib yangilandi');
    } catch (e) {
      message.error((e as ApiError).message || 'Xatolik');
    } finally {
      setReordering(false);
    }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerDto | null>(null);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const { mutateAsync: createMutation, isPending: isCreating } = useMutation<BannerDto, ApiError, CreateBannerPayload>({
    mutationFn: createBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      message.success('Slayd saqlandi');
    },
    onError: (error) => message.error(error.message || 'Saqlashda xatolik'),
  });

  const { mutateAsync: updateMutation, isPending: isUpdating } = useMutation<
    BannerDto,
    ApiError,
    { id: string; payload: UpdateBannerPayload }
  >({
    mutationFn: ({ id, payload }) => updateBanner(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      message.success('Slayd yangilandi');
    },
    onError: (error) => message.error(error.message || 'Yangilashda xatolik'),
  });

  const openCreateModal = () => {
    setEditingBanner(null);
    setPreviewImage(null);
    form.resetFields();
    form.setFieldsValue({ status: 'published', order: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (banner: BannerDto) => {
    setEditingBanner(banner);
    setPreviewImage(banner.image?.url ? normalizeImageUrl(banner.image.url) : null);
    form.setFieldsValue({
      title_uz: banner.title_uz,
      title_ru: banner.title_ru,
      text_uz: banner.text_uz ?? undefined,
      text_ru: banner.text_ru ?? undefined,
      ctaText_uz: banner.ctaText_uz ?? undefined,
      ctaText_ru: banner.ctaText_ru ?? undefined,
      ctaLink: banner.ctaLink ?? undefined,
      imageId: banner.imageId ?? undefined,
      order: banner.order,
      status: banner.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (banner: BannerDto) => {
    await deleteMutation(banner.id);
  };

  if (isError) {
    return (
      <div>
        <PageHeader title="Slaydlar" />
        <Alert
          type="error"
          message="Slaydlar yuklanmadi"
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: CreateBannerPayload = {
        title_uz: values.title_uz,
        title_ru: values.title_ru,
        text_uz: values.text_uz || undefined,
        text_ru: values.text_ru || undefined,
        ctaText_uz: values.ctaText_uz || undefined,
        ctaText_ru: values.ctaText_ru || undefined,
        ctaLink: values.ctaLink || undefined,
        imageId: values.imageId || undefined,
        order: typeof values.order === 'number' ? values.order : Number(values.order ?? 0),
        status: values.status,
      };

      if (editingBanner) {
        await updateMutation({ id: editingBanner.id, payload });
      } else {
        await createMutation(payload);
      }

      setIsModalOpen(false);
      form.resetFields();
      setPreviewImage(null);
    } catch (error) {
      // handled by form validation
    }
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

  const handleSelectMediaFromLibrary = (media: MediaDto) => {
    form.setFieldsValue({ imageId: media.id });
    setPreviewImage(normalizeImageUrl(media.url));
    setImageModalOpen(false);
    message.success('Rasm tanlandi');
  };

  const currentImageId = Form.useWatch('imageId', form);
  const currentMedia = mediaList?.find((m) => m.id === currentImageId);

  const columns: ColumnsType<BannerDto> = useMemo(
    () => [
      {
        title: 'Rasm',
        key: 'image',
        width: 100,
        render: (_, record) =>
          record.image?.url ? (
            <Image
              src={normalizeImageUrl(record.image.url)}
              alt={record.title_uz}
              width={60}
              height={60}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              preview={false}
            />
          ) : (
            <div style={{ width: 60, height: 60, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#999' }}>
              Rasm yo'q
            </div>
          ),
      },
      {
        title: 'Sarlavha',
        dataIndex: 'title_uz',
        key: 'title_uz',
        render: (value: string, record) => (
          <div>
            <strong>{value}</strong>
            {record.title_ru ? <div style={{ fontSize: 12, color: '#6b7280' }}>{record.title_ru}</div> : null}
          </div>
        ),
      },
      {
        title: 'Holati',
        dataIndex: 'status',
        key: 'status',
        render: (value: BannerDto['status']) => <StatusTag status={value} />,
      },
      {
        title: 'Tartib',
        dataIndex: 'order',
        key: 'order',
      },
      {
        title: 'CTA',
        key: 'cta',
        render: (_, record) =>
          record.ctaText_uz || record.ctaText_ru ? (
            <div>
              <div>{record.ctaText_uz}</div>
              {record.ctaLink ? (
                <a href={record.ctaLink} target="_blank" rel="noreferrer">
                  {record.ctaLink}
                </a>
              ) : null}
            </div>
          ) : (
            '—'
          ),
      },
      {
        title: 'Amallar',
        key: 'actions',
        width: 100,
        fixed: 'right' as const,
        render: (_, record) => (
          <TableActions onEdit={() => navigate(`/banners/${record.id}/edit`)} onDelete={() => handleDelete(record)} loading={isDeleting} />
        ),
      },
    ],
    [isDeleting, navigate, handleDelete],
  );

  const filtered = useMemo(() => {
    return (banners ?? []).filter((b) => {
      if (statusFilter && b.status !== statusFilter) return false;
      if (!searchText.trim()) return true;
      const q = searchText.toLowerCase();
      return b.title_uz.toLowerCase().includes(q) || (b.title_ru?.toLowerCase().includes(q) ?? false);
    });
  }, [banners, searchText, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Slaydlar"
        description="Bosh sahifa slider rasmlari"
        count={filtered.length}
        loading={tableLoading}
        action={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/banners/new')}>Yangi slayd</Button>}
      />
      <FilterPanel onClear={() => { setSearchText(''); setStatusFilter(undefined); }}>
        <Input placeholder="Sarlavha bo'yicha qidirish..." value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear size="large" className="min-w-[240px] flex-1" />
        <Select placeholder="Holat" allowClear value={statusFilter} onChange={setStatusFilter} options={statusOptions} className="min-w-[140px]" />
      </FilterPanel>
      {!searchText && !statusFilter ? (
        <SortableTable
          loading={tableLoading}
          reordering={reordering}
          dataSource={[...filtered].sort((a, b) => a.order - b.order)}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          onReorder={handleReorder}
        />
      ) : (
        <ListTable
          loading={tableLoading}
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )}

      <Modal
        title={editingBanner ? 'Slaydni tahrirlash' : 'Yangi slayd'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={isCreating || isUpdating}
        width={720}
        okText="Saqlash"
        cancelText="Bekor qilish"
      >
        <Form layout="vertical" form={form}>
          <div style={{ marginBottom: 16, padding: 12, background: '#f0f2f5', borderRadius: 4, fontSize: 12, color: '#666' }}>
            <strong>Slayd maydonlari:</strong> Sarlavha (katta ko'rinadigan), Matn (kichik qator), CTA matn (tugma matni), CTA havola (tugma havolasi), Rasm (o'ng paneldagi rasm)
          </div>
          
          <Form.Item
            label="Sarlavha (uz)"
            name="title_uz"
            rules={[{ required: true, message: 'Sarlavha (uz) majburiy' }]}
            extra="Slaydning katta sarlavhasi - asosiy matn"
          >
            <Input placeholder="Masalan, Cochlear implantlar" />
          </Form.Item>
          <Form.Item
            label="Sarlavha (ru)"
            name="title_ru"
            rules={[{ required: true, message: 'Sarlavha (ru) majburiy' }]}
            extra="Slaydning katta sarlavhasi - asosiy matn"
          >
            <Input placeholder="Например, Кохлеарные импланты" />
          </Form.Item>
          <Form.Item 
            label="Matn (uz)" 
            name="text_uz"
            extra="Sarlavha ostidagi kichik matn - qo'shimcha ma'lumot"
          >
            <Input.TextArea rows={2} placeholder="Masalan, Yangi avlod implantlari bilan eshitish imkoniyatini oshiring" />
          </Form.Item>
          <Form.Item 
            label="Matn (ru)" 
            name="text_ru"
            extra="Sarlavha ostidagi kichik matn - qo'shimcha ma'lumot"
          >
            <Input.TextArea rows={2} placeholder="Например, Улучшите слух с имплантами нового поколения" />
          </Form.Item>
          <Form.Item 
            label="CTA matn (uz)" 
            name="ctaText_uz"
            extra="To'q sariq tugmadagi matn"
          >
            <Input placeholder="Masalan, Cochlear haqida →" />
          </Form.Item>
          <Form.Item 
            label="CTA matn (ru)" 
            name="ctaText_ru"
            extra="To'q sariq tugmadagi matn"
          >
            <Input placeholder="Например, О Cochlear →" />
          </Form.Item>
          <Form.Item 
            label="CTA havola" 
            name="ctaLink" 
            extra="Masalan: https://example.com, tel:+998712021441, yoki /catalog"
            rules={[
              {
                validator: (_, value) => {
                  if (!value || value === '') return Promise.resolve();
                  // Allow http/https URLs, tel: links, relative paths, and anchors
                  if (
                    value.startsWith('http://') ||
                    value.startsWith('https://') ||
                    value.startsWith('tel:') ||
                    value.startsWith('/') ||
                    value.startsWith('#')
                  ) {
                    // Validate full URLs
                    if (value.startsWith('http://') || value.startsWith('https://')) {
                      try {
                        new URL(value);
                        return Promise.resolve();
                      } catch {
                        return Promise.reject(new Error('Noto\'g\'ri URL format'));
                      }
                    }
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Havola http://, https://, tel:, / yoki # bilan boshlanishi kerak'));
                },
              },
            ]}
          >
            <Input placeholder="https://example.com yoki tel:+998712021441" />
          </Form.Item>
          
          <ImageSizeHint type="banner" />
          <Form.Item 
            label="Rasm" 
            name="imageId"
            extra="O'ng paneldagi to'q sariq blokda ko'rinadigan rasm. Agar rasm tanlanmasa, 'Acoustic' matni ko'rinadi."
          >
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <Upload
                    customRequest={handleUpload}
                    showUploadList={false}
                    accept="image/*"
                    maxCount={1}
                  >
                    <Button icon={<UploadOutlined />} loading={uploading} block>
                      Yangi rasm yuklash
                    </Button>
                  </Upload>
                </Col>
                <Col span={12}>
                  {previewImage && (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleRemoveImage}
                      block
                    >
                      Rasmi o'chirish
                    </Button>
                  )}
                </Col>
              </Row>
              
              {(() => {
                const imageUrl = previewImage || currentMedia?.url;
                const normalizedUrl = imageUrl ? normalizeImageUrl(imageUrl) : '';
                console.log('Banner preview image:', { previewImage, currentMediaUrl: currentMedia?.url, imageUrl, normalizedUrl });
                return imageUrl ? (
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <div style={{ marginBottom: 8, fontSize: 12, color: '#666' }}>Tanlangan rasm (slaydda ko'rinadi):</div>
                    <img
                      src={normalizedUrl}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 4, display: 'block', margin: '0 auto' }}
                      onError={(e) => {
                        console.error('Image load error:', {
                          src: normalizedUrl,
                          previewImage,
                          currentMediaUrl: currentMedia?.url,
                          imageId: form.getFieldValue('imageId'),
                        });
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', normalizedUrl);
                      }}
                    />
                  </div>
                ) : null;
              })()}

              <div style={{ marginTop: 16 }}>
                <Button
                  icon={<FolderOutlined />}
                  onClick={() => setImageModalOpen(true)}
                  block
                  style={{ marginBottom: 8 }}
                >
                  Mavjud rasmdan tanlash
                </Button>
                {form.getFieldValue('imageId') && (
                  <div style={{ fontSize: 12, color: '#666' }}>
                    Tanlangan: {mediaList?.find(m => m.id === form.getFieldValue('imageId'))?.filename || 'Noma\'lum'}
                  </div>
                )}
              </div>
            </div>
          </Form.Item>

          <Form.Item 
            label="Tartib" 
            name="order" 
            initialValue={0}
            extra="Slaydlarning ko'rinish tartibi (kichik raqam birinchi)"
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item 
            label="Holat" 
            name="status" 
            initialValue="published"
            extra="Faqat 'Nashr etilgan' holatidagi slaydlar bosh sahifada ko'rinadi"
          >
            <Select options={statusOptions} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Media Library Modal for Banner Image */}
      <MediaLibraryModal
        open={imageModalOpen}
        onCancel={() => setImageModalOpen(false)}
        onSelect={handleSelectMediaFromLibrary}
        fileType="image"
        selectedMediaIds={form.getFieldValue('imageId') ? [form.getFieldValue('imageId')] : []}
      />
    </div>
  );
}
