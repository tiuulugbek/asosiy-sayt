import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Form, Input, InputNumber, Select, Switch, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FormPageShell from '../../components/common/FormPageShell';
import FormLayout, { PublishCard } from '../../components/common/FormLayout';
import LangTabs from '../../components/common/LangTabs';
import ImagePickerField from '../../components/common/ImagePickerField';
import RichTextEditor from '../../components/RichTextEditor';
import { useFormPage } from '../../hooks/useFormPage';
import {
  createProduct,
  updateProduct,
  getProductsAdmin,
  getCatalogsAdmin,
  getBrands,
  type ProductDto,
  type CreateProductPayload,
  ApiError,
} from '../../lib/api';
import { createSlug } from '../../utils/slug';
import { normalizeImageUrl } from '../../utils/image';

export default function ProductForm() {
  const { catId, id } = useParams<{ catId: string; id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEditing = Boolean(id);
  const [imageId, setImageId] = useState<string | undefined>();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data: products } = useQuery({ queryKey: ['products-admin'], queryFn: () => getProductsAdmin({ limit: 500 }) });
  const { data: catalogs } = useQuery({ queryKey: ['catalogs-admin'], queryFn: getCatalogsAdmin });
  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: getBrands });

  const productList = useMemo(() => {
    const raw = products as { items?: typeof products } | unknown[];
    return Array.isArray(raw) ? raw : (raw as { items?: unknown[] })?.items ?? [];
  }, [products]);

  const product = useMemo(
    () => (productList as { id: string }[]).find((p) => p.id === id),
    [productList, id],
  );

  useEffect(() => {
    if (!product) {
      if (catId && catId !== 'new') form.setFieldsValue({ catalogIds: [catId] });
      return;
    }
    const p = product as ProductDto;
    form.setFieldsValue({
      name_uz: p.name_uz,
      name_ru: p.name_ru,
      slug: p.slug,
      description_uz: p.description_uz,
      description_ru: p.description_ru,
      productType: p.productType ?? undefined,
      catalogIds: p.catalogs?.map((catalog) => catalog.id) ?? [],
      brandId: p.brandId ?? p.brand?.id ?? undefined,
      price: p.price ? Number(p.price) : undefined,
      status: p.status,
      specsText: p.specsText ?? undefined,
      galleryIds: p.galleryIds ?? [],
    });
    const firstImageId = p.galleryIds?.[0];
    const firstImageUrl = p.galleryUrls?.[0];
    setImageId(firstImageId);
    setImageUrl(firstImageUrl ? normalizeImageUrl(firstImageUrl) : null);
  }, [product, catId, form]);

  const { mutateAsync: save, isPending: saving } = useMutation({
    mutationFn: async (payload: CreateProductPayload) =>
      isEditing && id ? updateProduct(id, payload) : createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-admin'] });
      message.success('Mahsulot saqlandi');
      navigate('/catalog');
    },
    onError: (e: ApiError) => message.error(e.message || 'Xatolik'),
  });

  const handleSave = async () => {
    const v = await form.validateFields();
    await save({
      name_uz: v.name_uz,
      name_ru: v.name_ru,
      slug: v.slug,
      productType: v.productType,
      description_uz: v.description_uz,
      description_ru: v.description_ru,
      catalogIds: v.catalogIds ?? [],
      brandId: v.brandId || null,
      price:
        v.price === undefined || v.price === null || v.price === ''
          ? null
          : Number(v.price),
      status: v.status,
      specsText: v.specsText || null,
      galleryIds: imageId ? [imageId] : (v.galleryIds ?? []),
    });
  };

  const { handleCancel } = useFormPage('/catalog', handleSave);
  const isPublished = Form.useWatch('status', form) === 'published';

  return (
    <FormPageShell title={isEditing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'} backTo="/catalog">
      <Form form={form} layout="vertical" initialValues={{ status: 'published', catalogIds: [], productType: 'hearing-aids' }}>
        <FormLayout
          left={
            <>
              <Card title="Asosiy ma'lumot">
                <LangTabs>
                  {(lang) => (
                    <>
                      <Form.Item
                        label={`Nomi (${lang})`}
                        name={lang === 'uz' ? 'name_uz' : 'name_ru'}
                        rules={[{ required: true }]}
                      >
                        <Input
                          onChange={
                            lang === 'uz'
                              ? (e) => {
                                  if (!form.getFieldValue('slug')) form.setFieldsValue({ slug: createSlug(e.target.value) });
                                }
                              : undefined
                          }
                        />
                      </Form.Item>
                      <Form.Item
                        label={`Tavsif (${lang})`}
                        name={lang === 'uz' ? 'description_uz' : 'description_ru'}
                        valuePropName="value"
                        trigger="onChange"
                      >
                        <RichTextEditor />
                      </Form.Item>
                    </>
                  )}
                </LangTabs>
                <Form.Item label="Slug" name="slug" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Card>
              <Card title="Texnik xususiyatlar" className="mt-4">
                <Form.Item label="Xususiyatlar matni" name="specsText">
                  <Input.TextArea rows={6} placeholder="Masalan: Quvvat: yuqori" />
                </Form.Item>
              </Card>
              <Card title="Rasm" className="mt-4">
                <ImagePickerField
                  value={imageId}
                  previewUrl={imageUrl}
                  onChange={(mid, url) => {
                    setImageId(mid);
                    setImageUrl(url ?? null);
                  }}
                />
              </Card>
            </>
          }
          right={
            <>
              <PublishCard
                footer={
                  <>
                    <Button block onClick={handleCancel}>
                      Bekor qilish
                    </Button>
                    <Button type="primary" block loading={saving} onClick={() => handleSave().catch(() => undefined)}>
                      Saqlash ✓
                    </Button>
                  </>
                }
              >
                <div className="mb-4 flex items-center justify-between">
                  <span>{isPublished ? '✅ Nashr' : '📝 Qoralama'}</span>
                  <Switch checked={isPublished} onChange={(c) => form.setFieldsValue({ status: c ? 'published' : 'draft' })} />
                </div>
                <Form.Item label="Mahsulot turi" name="productType" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { label: 'Eshitish moslamalari', value: 'hearing-aids' },
                      { label: 'Aksessuarlar', value: 'accessories' },
                      { label: 'Interacoustics', value: 'interacoustics' },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="Kataloglar" name="catalogIds" rules={[{ required: true }]}>
                  <Select mode="multiple" options={(catalogs ?? []).map((c) => ({ label: c.name_uz, value: c.id }))} />
                </Form.Item>
                <Form.Item label="Brend" name="brandId">
                  <Select allowClear options={(brands ?? []).map((b) => ({ label: b.name, value: b.id }))} />
                </Form.Item>
              </PublishCard>
              <Card title="Narx" className="mt-4">
                <Form.Item label="Narx" name="price">
                  <InputNumber min={0} className="w-full" addonAfter="UZS" />
                </Form.Item>
              </Card>
            </>
          }
        />
      </Form>
    </FormPageShell>
  );
}
