import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Collapse, Form, Input, InputNumber, Select, Switch, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FormPageShell from '../../components/common/FormPageShell';
import FormLayout, { PublishCard } from '../../components/common/FormLayout';
import LangTabs from '../../components/common/LangTabs';
import ImagePickerField from '../../components/common/ImagePickerField';
import RichTextEditor from '../../components/RichTextEditor';
import { useFormPage } from '../../hooks/useFormPage';
import {
  createCatalog,
  updateCatalog,
  getCatalogsAdmin,
  type CreateCatalogPayload,
  ApiError,
} from '../../lib/api';
import { createSlug } from '../../utils/slug';
import { normalizeImageUrl } from '../../utils/image';

export default function CatalogForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEditing = Boolean(id);
  const [imageId, setImageId] = useState<string | undefined>();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data: catalogs } = useQuery({ queryKey: ['catalogs-admin'], queryFn: getCatalogsAdmin });
  const catalog = useMemo(() => catalogs?.find((c) => c.id === id), [catalogs, id]);

  useEffect(() => {
    if (!catalog) return;
    form.setFieldsValue({
      name_uz: catalog.name_uz,
      name_ru: catalog.name_ru,
      slug: catalog.slug,
      description_uz: catalog.description_uz,
      description_ru: catalog.description_ru,
      order: catalog.order,
      status: catalog.status,
      showOnHomepage: catalog.showOnHomepage,
    });
    setImageId(catalog.image?.id);
    setImageUrl(catalog.image?.url ? normalizeImageUrl(catalog.image.url) : null);
  }, [catalog, form]);

  const { mutateAsync: save, isPending: saving } = useMutation({
    mutationFn: async (payload: CreateCatalogPayload) =>
      isEditing && id ? updateCatalog(id, payload) : createCatalog(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs-admin'] });
      message.success('Katalog saqlandi');
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
      description_uz: v.description_uz,
      description_ru: v.description_ru,
      order: Number(v.order ?? 0),
      status: v.status,
      showOnHomepage: v.showOnHomepage,
      imageId: imageId || undefined,
    });
  };

  const { handleCancel } = useFormPage('/catalog', handleSave);
  const isPublished = Form.useWatch('status', form) === 'published';

  return (
    <FormPageShell title={isEditing ? catalog?.name_uz ?? 'Katalog' : 'Yangi katalog'} backTo="/catalog">
      <Form form={form} layout="vertical" initialValues={{ status: 'published', order: 0, showOnHomepage: false }}>
        <FormLayout
          left={
            <>
              <Card title="Kontent">
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
                      <Form.Item label={`Qisqa (${lang})`} name={lang === 'uz' ? 'description_uz' : 'description_ru'}>
                        <Input.TextArea rows={3} />
                      </Form.Item>
                    </>
                  )}
                </LangTabs>
                <Form.Item label="Slug" name="slug" rules={[{ required: true }]}>
                  <Input />
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
                  hint="800×400px"
                />
              </Card>
            </>
          }
          right={
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
              <Form.Item label="Bosh sahifada" name="showOnHomepage" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item label="Tartib" name="order">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </PublishCard>
          }
        />
      </Form>
    </FormPageShell>
  );
}
