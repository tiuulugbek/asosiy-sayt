import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Form, Input, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FormPageShell from '../../components/common/FormPageShell';
import FormLayout, { PublishCard } from '../../components/common/FormLayout';
import LangTabs from '../../components/common/LangTabs';
import ImagePickerField from '../../components/common/ImagePickerField';
import { useFormPage } from '../../hooks/useFormPage';
import {
  createBrand,
  updateBrand,
  getBrands,
  type BrandDto,
  type CreateBrandPayload,
  ApiError,
} from '../../lib/api';
import { createSlug } from '../../utils/slug';
import { normalizeImageUrl } from '../../utils/image';

export default function BrandForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEditing = Boolean(id);
  const [logoId, setLogoId] = useState<string | undefined>();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const { data: brands } = useQuery({ queryKey: ['brands'], queryFn: getBrands });
  const brand = useMemo(() => brands?.find((b) => b.id === id), [brands, id]);

  useEffect(() => {
    if (!brand) return;
    form.setFieldsValue({
      name: brand.name,
      slug: brand.slug,
      desc_uz: brand.desc_uz,
      desc_ru: brand.desc_ru,
    });
    setLogoId(brand.logo?.id);
    setLogoUrl(brand.logo?.url ? normalizeImageUrl(brand.logo.url) : null);
  }, [brand, form]);

  const { mutateAsync: save, isPending: saving } = useMutation({
    mutationFn: async (payload: CreateBrandPayload) =>
      isEditing && id ? updateBrand(id, payload) : createBrand(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      message.success('Brend saqlandi');
      navigate('/brands');
    },
    onError: (e: ApiError) => message.error(e.message || 'Xatolik'),
  });

  const handleSave = async () => {
    const v = await form.validateFields();
    await save({
      name: v.name,
      slug: v.slug,
      desc_uz: v.desc_uz,
      desc_ru: v.desc_ru,
      logoId: logoId || undefined,
    });
  };

  const { handleCancel } = useFormPage('/brands', handleSave);

  return (
    <FormPageShell
      title={isEditing ? brand?.name ?? 'Brendni tahrirlash' : 'Yangi brend'}
      backTo="/brands"
    >
      <Form form={form} layout="vertical">
        <FormLayout
          left={
            <Card title="Brend ma'lumotlari">
              <Form.Item label="Brend nomi" name="name" rules={[{ required: true }]}>
                <Input
                  onChange={(e) => {
                    const n = e.target.value;
                    if (!form.getFieldValue('slug') || form.getFieldValue('slug') === createSlug(form.getFieldValue('name') || '')) {
                      form.setFieldsValue({ slug: createSlug(n) });
                    }
                  }}
                />
              </Form.Item>
              <Form.Item label="Slug" name="slug" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <LangTabs>
                {(lang) => (
                  <Form.Item label={`Ta'rif (${lang})`} name={lang === 'uz' ? 'desc_uz' : 'desc_ru'}>
                    <Input.TextArea rows={4} />
                  </Form.Item>
                )}
              </LangTabs>
              <Form.Item label="Veb-sayt" name="website">
                <Input addonBefore="https://" placeholder="example.com" />
              </Form.Item>
            </Card>
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
                <p className="text-sm text-[var(--admin-text-muted)]">Logo va asosiy ma&apos;lumotlar</p>
              </PublishCard>
              <Card title="Logo" className="mt-4">
                <div className="rounded-lg bg-white p-4">
                  <ImagePickerField
                    value={logoId}
                    previewUrl={logoUrl}
                    onChange={(mid, url) => {
                      setLogoId(mid);
                      setLogoUrl(url ?? null);
                    }}
                    hint="Tavsiya: 300×150px, PNG (shaffof fon)"
                  />
                </div>
              </Card>
            </>
          }
        />
      </Form>
    </FormPageShell>
  );
}
