import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  message,
  Modal,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/common/PageHeader';
import LangTabs from '../../components/common/LangTabs';
import ImagePickerField from '../../components/common/ImagePickerField';
import RichTextEditor from '../../components/RichTextEditor';
import {
  createService,
  updateService,
  getServices,
  getServiceCategoriesAdmin,
  type ServiceDto,
  type CreateServicePayload,
  ApiError,
} from '../../lib/api';
import { createSlug } from '../../utils/slug';
import { normalizeImageUrl } from '../../utils/image';

const statusOptions = [
  { label: 'Nashr etilgan', value: 'published' },
  { label: 'Qoralama', value: 'draft' },
  { label: 'Arxiv', value: 'archived' },
];

export default function ServiceForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEditing = Boolean(id);

  const [coverId, setCoverId] = useState<string | undefined>();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [altCoverId, setAltCoverId] = useState<string | undefined>();
  const [altCoverUrl, setAltCoverUrl] = useState<string | null>(null);

  const { data: services } = useQuery<ServiceDto[], ApiError>({
    queryKey: ['services'],
    queryFn: getServices,
  });

  const { data: categoriesRaw } = useQuery({
    queryKey: ['service-categories-admin'],
    queryFn: getServiceCategoriesAdmin,
  });

  const categories = useMemo(
    () => (Array.isArray(categoriesRaw) ? categoriesRaw : (categoriesRaw as { items?: unknown[] })?.items ?? []),
    [categoriesRaw],
  );

  const service = useMemo(() => services?.find((s) => s.id === id), [services, id]);

  useEffect(() => {
    if (!isEditing || !service) return;
    form.setFieldsValue({
      title_uz: service.title_uz,
      title_ru: service.title_ru,
      excerpt_uz: service.excerpt_uz,
      excerpt_ru: service.excerpt_ru,
      body_uz: service.body_uz,
      body_ru: service.body_ru,
      slug: service.slug,
      order: service.order,
      status: service.status,
      categoryId: service.category?.id ? [service.category.id] : [],
      showOnHomepage: (service as ServiceDto & { showOnHomepage?: boolean }).showOnHomepage,
    });
    setCoverId(service.cover?.id);
    setCoverUrl(service.cover?.url ? normalizeImageUrl(service.cover.url) : null);
    const alt = (service as ServiceDto & { alternativeCover?: { id: string; url: string } }).alternativeCover;
    setAltCoverId(alt?.id);
    setAltCoverUrl(alt?.url ? normalizeImageUrl(alt.url) : null);
  }, [service, isEditing, form]);

  const { mutateAsync: save, isPending: saving } = useMutation({
    mutationFn: async (payload: CreateServicePayload) => {
      if (isEditing && id) {
        return updateService(id, payload);
      }
      return createService(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      message.success('Xizmat saqlandi');
      navigate('/services');
    },
    onError: (e: ApiError) => message.error(e.message || 'Saqlashda xatolik'),
  });

  const handleSave = async () => {
    const values = await form.validateFields();
    const categoryId = Array.isArray(values.categoryId)
      ? values.categoryId[0]
      : values.categoryId;

    const payload: CreateServicePayload = {
      title_uz: values.title_uz,
      title_ru: values.title_ru,
      excerpt_uz: values.excerpt_uz,
      excerpt_ru: values.excerpt_ru,
      body_uz: values.body_uz,
      body_ru: values.body_ru,
      slug: values.slug,
      order: Number(values.order ?? 0),
      status: values.status,
      coverId: coverId || undefined,
      alternativeCoverId: altCoverId || undefined,
      categoryId: categoryId || undefined,
    };
    await save(payload);
  };

  const handleCancel = () => {
    Modal.confirm({
      title: "O'zgarishlar saqlanmaydi",
      content: 'Chiqishni xohlaysizmi?',
      okText: 'Ha, chiqish',
      cancelText: 'Qolish',
      onOk: () => navigate('/services'),
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave().catch(() => undefined);
      }
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const isPublished = Form.useWatch('status', form) === 'published';

  return (
    <div>
      <PageHeader
        title={isEditing ? service?.title_uz ?? 'Xizmatni tahrirlash' : 'Yangi xizmat'}
        description="Xizmat kontenti va nashr sozlamalari"
        action={
          <Button type="link" onClick={() => navigate('/services')}>
            ← Orqaga
          </Button>
        }
      />

      <Form form={form} layout="vertical" initialValues={{ status: 'published', order: 0 }}>
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title="Kontent">
              <LangTabs>
                {(lang) =>
                  lang === 'uz' ? (
                    <>
                      <Form.Item label="Sarlavha" name="title_uz" rules={[{ required: true }]}>
                        <Input
                          maxLength={200}
                          onChange={(e) => {
                            const slug = form.getFieldValue('slug');
                            if (!slug || slug === createSlug(form.getFieldValue('title_uz') || '')) {
                              form.setFieldsValue({ slug: createSlug(e.target.value) });
                            }
                          }}
                        />
                      </Form.Item>
                      <Form.Item label="Slug" name="slug" rules={[{ required: true }]}>
                        <Input addonBefore="/services/" />
                      </Form.Item>
                      <Form.Item label="Qisqa tavsif" name="excerpt_uz">
                        <Input.TextArea rows={3} maxLength={500} showCount />
                      </Form.Item>
                      <Form.Item label="Batafsil mazmun" name="body_uz" valuePropName="value" trigger="onChange">
                        <RichTextEditor />
                      </Form.Item>
                    </>
                  ) : (
                    <>
                      <Form.Item label="Sarlavha" name="title_ru" rules={[{ required: true }]}>
                        <Input maxLength={200} />
                      </Form.Item>
                      <Form.Item label="Qisqa tavsif" name="excerpt_ru">
                        <Input.TextArea rows={3} maxLength={500} showCount />
                      </Form.Item>
                      <Form.Item label="Batafsil mazmun" name="body_ru" valuePropName="value" trigger="onChange">
                        <RichTextEditor />
                      </Form.Item>
                    </>
                  )
                }
              </LangTabs>
            </Card>

            <Card title="Rasmlar" className="mt-4">
              <Row gutter={16}>
                <Col span={12}>
                  <p className="mb-2 text-sm font-medium">Asosiy rasm</p>
                  <ImagePickerField
                    value={coverId}
                    previewUrl={coverUrl}
                    onChange={(mid, url) => {
                      setCoverId(mid);
                      setCoverUrl(url ?? null);
                    }}
                    hint="Tavsiya: 800×600px, JPG/PNG"
                  />
                </Col>
                <Col span={12}>
                  <p className="mb-2 text-sm font-medium">Muqova rasmi</p>
                  <ImagePickerField
                    value={altCoverId}
                    previewUrl={altCoverUrl}
                    onChange={(mid, url) => {
                      setAltCoverId(mid);
                      setAltCoverUrl(url ?? null);
                    }}
                    hint="Tavsiya: 1200×600px, 16:9"
                    aspectClass="aspect-video"
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Nashr sozlamalari" className="sticky top-20">
              <div className="mb-4 flex gap-2">
                <Button block onClick={handleCancel}>
                  Bekor qilish
                </Button>
                <Button type="primary" block loading={saving} onClick={() => handleSave().catch(() => undefined)}>
                  Saqlash ✓
                </Button>
              </div>
              <Divider />
              <Form.Item label="Holat" name="status">
                <div className="flex items-center justify-between">
                  <span>{isPublished ? '✅ Nashr etilgan' : '📝 Qoralama'}</span>
                  <Switch
                    checked={isPublished}
                    onChange={(c) => form.setFieldsValue({ status: c ? 'published' : 'draft' })}
                  />
                </div>
              </Form.Item>
              <Form.Item label="Kategoriya" name="categoryId">
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  placeholder="Kategoriya tanlang"
                  options={(categories as { id: string; name_uz: string; name_ru?: string }[]).map((c) => ({
                    label: `${c.name_uz}${c.name_ru ? ` / ${c.name_ru}` : ''}`,
                    value: c.id,
                  }))}
                />
              </Form.Item>
              <Form.Item label="Tartib raqami" name="order">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
              <Form.Item name="showOnHomepage" valuePropName="checked">
                <Checkbox>Bosh sahifa xizmatlari ro&apos;yxatida ko&apos;rsatish</Checkbox>
              </Form.Item>
              {isEditing && service && (
                <>
                  <Divider />
                  <p className="text-xs text-[var(--admin-text-muted)]">
                    Yaratilgan: {new Date(service.createdAt).toLocaleString('uz-UZ')}
                    <br />
                    Yangilangan: {new Date(service.updatedAt).toLocaleString('uz-UZ')}
                  </p>
                </>
              )}
            </Card>

            <Collapse
              className="mt-4"
              items={[
                {
                  key: 'seo',
                  label: 'SEO',
                  children: (
                    <>
                      <Form.Item label="Meta sarlavha (uz)" name="metaTitle_uz">
                        <Input maxLength={60} showCount />
                      </Form.Item>
                      <Form.Item label="Meta tavsif (uz)" name="metaDesc_uz">
                        <Input.TextArea rows={3} maxLength={160} showCount />
                      </Form.Item>
                    </>
                  ),
                },
              ]}
            />
          </Col>
        </Row>
      </Form>
    </div>
  );
}
