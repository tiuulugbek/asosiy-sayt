import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Form, Input, message, Upload } from 'antd';
import { PlusOutlined, UploadOutlined, FolderOutlined, DeleteOutlined } from '@ant-design/icons';
import PageHeader from '../components/common/PageHeader';
import FilterPanel from '../components/common/FilterPanel';
import ListTable from '../components/common/ListTable';
import TableActions from '../components/common/TableActions';
import LangTabs from '../components/common/LangTabs';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadMedia,
  getMedia,
  type BrandDto,
  type CreateBrandPayload,
  type UpdateBrandPayload,
  type MediaDto,
  ApiError,
} from '../lib/api';
import { normalizeImageUrl } from '../utils/image';
import MediaLibraryModal from '../components/MediaLibraryModal';
import { compressImage } from '../utils/image-compression';
import { createSlug } from '../utils/slug';
import { useTableLoading } from '../hooks/useTableLoading';

export default function BrandsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: brands, isLoading, isFetching, isPending } = useQuery<BrandDto[], ApiError>({
    queryKey: ['brands'],
    queryFn: getBrands,
  });
  const tableLoading = useTableLoading({ isLoading, isFetching, isPending });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandDto | null>(null);
  const [form] = Form.useForm();
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoModalOpen, setLogoModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const { data: mediaList } = useQuery<MediaDto[], ApiError>({
    queryKey: ['media'],
    queryFn: getMedia,
  });

  const { mutateAsync: createMutation, isPending: isCreating } = useMutation<BrandDto, ApiError, CreateBrandPayload>({
    mutationFn: createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      message.success('Brend saqlandi');
    },
    onError: (error) => message.error(error.message || 'Saqlashda xatolik'),
  });

  const { mutateAsync: updateMutation, isPending: isUpdating } = useMutation<
    BrandDto,
    ApiError,
    { id: string; payload: UpdateBrandPayload }
  >({
    mutationFn: ({ id, payload }) => updateBrand(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      message.success('Brend yangilandi');
    },
    onError: (error) => message.error(error.message || 'Yangilashda xatolik'),
  });

  const { mutateAsync: deleteMutation, isPending: isDeleting } = useMutation<void, ApiError, string>({
    mutationFn: deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      message.success('Brend o‘chirildi');
    },
    onError: (error) => message.error(error.message || "O'chirishda xatolik"),
  });

  const openCreateModal = () => {
    setEditingBrand(null);
    setPreviewLogo(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (brand: BrandDto) => {
    setEditingBrand(brand);
    form.setFieldsValue({
      name: brand.name,
      slug: brand.slug,
      desc_uz: brand.desc_uz ?? undefined,
      desc_ru: brand.desc_ru ?? undefined,
      logoId: brand.logo?.id ?? undefined,
    });
    setPreviewLogo(brand.logo?.url ? normalizeImageUrl(brand.logo.url) : null);
    setIsModalOpen(true);
  };

  const handleLogoUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setUploadingLogo(true);
    try {
      console.log('📤 Starting logo upload:', {
        name: (file as File).name,
        size: (file as File).size,
        type: (file as File).type,
      });

      const compressedFile = await compressImage(file as File);
      console.log('📦 Compressed file:', {
        name: compressedFile.name,
        size: compressedFile.size,
        type: compressedFile.type,
      });

      const media = await uploadMedia(compressedFile);
      
      if (!media || !media.id) {
        throw new Error('Media yuklanmadi - server javob bermadi');
      }

      console.log('✅ Logo uploaded successfully:', {
        id: media.id,
        url: media.url,
      });

      form.setFieldsValue({ logoId: media.id });
      const normalizedUrl = normalizeImageUrl(media.url);
      console.log('🔗 URL normalization:', {
        original: media.url,
        normalized: normalizedUrl,
        apiBase: import.meta.env.VITE_API_URL,
      });
      setPreviewLogo(normalizedUrl);
      message.success('Logo yuklandi');
      queryClient.invalidateQueries({ queryKey: ['media'] });
      onSuccess?.(media);
    } catch (error) {
      console.error('❌ Logo upload error:', error);
      const apiError = error as ApiError;
      
      let errorMessage = 'Logo yuklashda xatolik';
      if (apiError.message) {
        errorMessage = apiError.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Xatolik turiga qarab maxsus xabarlar
      if (apiError.status === 401) {
        errorMessage = 'Sessiya tugadi. Iltimos, qayta kiring.';
      } else if (apiError.status === 403) {
        errorMessage = 'Rasm yuklash uchun ruxsat yo\'q.';
      } else if (apiError.status === 413) {
        errorMessage = 'Rasm hajmi juda katta. Maksimal hajm: 10MB';
      }

      message.error(errorMessage);
      onError?.(error as Error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    form.setFieldsValue({ logoId: undefined });
    setPreviewLogo(null);
  };

  const handleSelectExistingLogo = (mediaId: string, mediaUrl: string) => {
    form.setFieldsValue({ logoId: mediaId });
    setPreviewLogo(normalizeImageUrl(mediaUrl));
    setLogoModalOpen(false);
  };

  const handleDelete = async (brand: BrandDto) => {
    await deleteMutation(brand.id);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: CreateBrandPayload = {
        name: values.name,
        slug: values.slug,
        desc_uz: values.desc_uz || undefined,
        desc_ru: values.desc_ru || undefined,
        logoId: values.logoId || undefined,
      };

      if (editingBrand) {
        await updateMutation({ id: editingBrand.id, payload });
      } else {
        await createMutation(payload);
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      // handled by form validation
    }
  };

  const filteredBrands = useMemo(() => {
    if (!searchText.trim()) return brands ?? [];
    const q = searchText.toLowerCase();
    return (brands ?? []).filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        (b.desc_uz?.toLowerCase().includes(q) ?? false),
    );
  }, [brands, searchText]);

  const columns: ColumnsType<BrandDto> = useMemo(
    () => [
      {
        title: 'Brend',
        key: 'brand',
        render: (_, record) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-white p-1">
              {record.logo?.url ? (
                <img
                  src={normalizeImageUrl(record.logo.url)}
                  alt={record.name}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-[10px] text-[var(--admin-text-muted)]">—</span>
              )}
            </div>
            <strong>{record.name}</strong>
          </div>
        ),
      },
      { title: 'Slug', dataIndex: 'slug', key: 'slug', width: 160 },
      {
        title: "Ta'rif (uz)",
        dataIndex: 'desc_uz',
        key: 'desc_uz',
        ellipsis: true,
        render: (value: string | undefined) => (
          <span title={value ?? ''}>{value ? (value.length > 60 ? `${value.slice(0, 60)}…` : value) : '—'}</span>
        ),
      },
      {
        title: 'Amallar',
        key: 'actions',
        width: 100,
        fixed: 'right',
        render: (_, record) => (
          <TableActions
            onEdit={() => navigate(`/brands/${record.id}/edit`)}
            onDelete={() => handleDelete(record)}
            loading={isDeleting}
          />
        ),
      },
    ],
    [isDeleting],
  );

  return (
    <div>
      <PageHeader
        title="Brendlar"
        description="Mahsulot brendlarini boshqaring"
        count={filteredBrands.length}
        loading={tableLoading}
        action={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/brands/new')}>
            Yangi brend
          </Button>
        }
      />

      <FilterPanel onClear={() => setSearchText('')}>
        <Input
          placeholder="Brend nomi yoki slug bo'yicha qidirish..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          size="large"
          className="min-w-[280px] flex-1"
        />
      </FilterPanel>

      <ListTable loading={tableLoading} dataSource={filteredBrands} columns={columns} scroll={{ x: 800 }} />

      <Modal
        title={editingBrand ? 'Brendni tahrirlash' : 'Yangi brend'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={isCreating || isUpdating}
        width={600}
        okText="Saqlash"
        cancelText="Bekor qilish"
      >
        <Form layout="vertical" form={form}>
          <Form.Item label="Nomi" name="name" rules={[{ required: true, message: 'Nomi majburiy' }]}>
            <Input 
              placeholder="Masalan, Oticon"
              onChange={(e) => {
                const name = e.target.value;
                const currentSlug = form.getFieldValue('slug');
                if (!currentSlug || currentSlug === createSlug(form.getFieldValue('name') || '')) {
                  form.setFieldsValue({ slug: createSlug(name) });
                }
              }}
            />
          </Form.Item>
          <Form.Item 
            label="Slug" 
            name="slug" 
            rules={[{ required: true, message: 'Slug majburiy' }]}
            extra="URL uchun qisqa nom (avtomatik yaratiladi yoki qo'lda kiriting)"
          >
            <Input placeholder="Avtomatik yaratiladi..." />
          </Form.Item>
          <Form.Item label="Ta'rif (uz)" name="desc_uz">
            <Input.TextArea rows={3} placeholder="Brend haqida qisqa maʼlumot" />
          </Form.Item>
          <Form.Item label="Ta'rif (ru)" name="desc_ru">
            <Input.TextArea rows={3} placeholder="Краткое описание бренда" />
          </Form.Item>
          <Form.Item label="Logo" name="logoId">
            <div>
              {previewLogo ? (
                <div style={{ marginBottom: 16 }}>
                  <img
                    src={previewLogo}
                    alt="Logo preview"
                    style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain', border: '1px solid #d9d9d9', borderRadius: 4, padding: 8 }}
                  />
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleRemoveLogo}
                    style={{ marginTop: 8 }}
                  >
                    O'chirish
                  </Button>
                </div>
              ) : null}
              
              <Upload
                customRequest={handleLogoUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />} loading={uploadingLogo} block>
                  {previewLogo ? 'Logoni almashtirish' : 'Logo yuklash'}
                </Button>
              </Upload>

              {/* Select from existing media */}
              <div style={{ marginTop: 16 }}>
                <Button
                  icon={<FolderOutlined />}
                  onClick={() => setLogoModalOpen(true)}
                  block
                  style={{ marginBottom: 8 }}
                >
                  Mavjud rasmdan tanlash
                </Button>
                {form.getFieldValue('logoId') && (() => {
                  const selectedMedia = mediaList?.find(m => m.id === form.getFieldValue('logoId'));
                  if (selectedMedia) {
                    // Filename'ni tozalash - blob nomlarini olib tashlash
                    let displayName = selectedMedia.filename || selectedMedia.alt_uz || 'Noma\'lum';
                    // Blob nomlarini olib tashlash
                    displayName = displayName.replace(/^[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]+-blob-[a-z0-9]+-?/i, '');
                    // Fayl kengaytmasini olib tashlash
                    displayName = displayName.replace(/\.[^/.]+$/, '');
                    // Hajmni ko'rsatish
                    const sizeKB = selectedMedia.size ? (selectedMedia.size / 1024).toFixed(1) : '?';
                    return (
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        Tanlangan: {displayName} ({sizeKB} KB)
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Media Library Modal for Logo */}
      <MediaLibraryModal
        open={logoModalOpen}
        onCancel={() => setLogoModalOpen(false)}
        onSelect={(media) => handleSelectExistingLogo(media.id, media.url)}
        fileType="image"
        selectedMediaIds={form.getFieldValue('logoId') ? [form.getFieldValue('logoId')] : []}
      />
    </div>
  );
}
