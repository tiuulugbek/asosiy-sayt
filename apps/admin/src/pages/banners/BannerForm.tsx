import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Divider, Form, Input, InputNumber, Radio, Switch, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FormPageShell from '../../components/common/FormPageShell';
import FormLayout, { PublishCard } from '../../components/common/FormLayout';
import LangTabs from '../../components/common/LangTabs';
import ImagePickerField from '../../components/common/ImagePickerField';
import { useFormPage } from '../../hooks/useFormPage';
import { type CreateBannerPayload, ApiError } from '../../lib/api';
import { createBanner, fetchBanners, updateBanner } from '../../services/banners.service';
import { normalizeImageUrl } from '../../utils/image';

export default function BannerForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEditing = Boolean(id);
  const [imageId, setImageId] = useState<string | undefined>();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data: banners } = useQuery({ queryKey: ['banners'], queryFn: fetchBanners });
  const banner = useMemo(() => banners?.find((b) => b.id === id), [banners, id]);

  useEffect(() => {
    if (!banner) return;
    form.setFieldsValue({
      title_uz: banner.title_uz,
      title_ru: banner.title_ru,
      ctaText_uz: banner.ctaText_uz,
      ctaText_ru: banner.ctaText_ru,
      ctaLink: banner.ctaLink,
      order: banner.order,
      status: banner.status,
      openInNewTab: false,
    });
    setImageId(banner.image?.id);
    setImageUrl(banner.image?.url ? normalizeImageUrl(banner.image.url) : null);
  }, [banner, form]);

  const { mutateAsync: save, isPending: saving } = useMutation({
    mutationFn: async (payload: CreateBannerPayload) =>
      isEditing && id ? updateBanner(id, payload) : createBanner(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      message.success('Slayd saqlandi');
      navigate('/banners');
    },
    onError: (e: ApiError) => message.error(e.message || 'Xatolik'),
  });

  const handleSave = async () => {
    const v = await form.validateFields();
    await save({
      title_uz: v.title_uz || '',
      title_ru: v.title_ru || '',
      ctaText_uz: v.ctaText_uz,
      ctaText_ru: v.ctaText_ru,
      ctaLink: v.ctaLink,
      order: Number(v.order ?? 0),
      status: v.status,
      imageId: imageId || undefined,
    });
  };

  const { handleCancel } = useFormPage('/banners', handleSave);
  const isPublished = Form.useWatch('status', form) === 'published';

  return (
    <FormPageShell
      title={isEditing ? 'Slaydni tahrirlash' : 'Yangi slayd'}
      backTo="/banners"
    >
      <Form form={form} layout="vertical" initialValues={{ status: 'published', order: 0 }}>
        <FormLayout
          left={
            <>
              <Card title="Slayd rasmi">
                <div className="aspect-video max-w-2xl overflow-hidden rounded-lg border">
                  <ImagePickerField
                    value={imageId}
                    previewUrl={imageUrl}
                    onChange={(mid, url) => {
                      setImageId(mid);
                      setImageUrl(url ?? null);
                    }}
                    hint="Tavsiya: 1920×600px yoki 1200×450px"
                    aspectClass="aspect-video w-full max-w-none !w-full"
                  />
                </div>
              </Card>
              <Card title="Kontent" className="mt-4">
                <LangTabs>
                  {(lang) => (
                    <>
                      <Form.Item label={`Sarlavha (${lang})`} name={lang === 'uz' ? 'title_uz' : 'title_ru'}>
                        <Input />
                      </Form.Item>
                      <Form.Item label={`Tugma matni (${lang})`} name={lang === 'uz' ? 'ctaText_uz' : 'ctaText_ru'}>
                        <Input placeholder="Batafsil →" />
                      </Form.Item>
                    </>
                  )}
                </LangTabs>
                <Form.Item label="URL" name="ctaLink">
                  <Input placeholder="/services yoki https://..." />
                </Form.Item>
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
              <Form.Item label="Holat" name="status" hidden>
                <Input />
              </Form.Item>
              <div className="mb-4 flex items-center justify-between">
                <span>{isPublished ? '✅ Nashr etilgan' : '📝 Qoralama'}</span>
                <Switch
                  checked={isPublished}
                  onChange={(c) => form.setFieldsValue({ status: c ? 'published' : 'draft' })}
                />
              </div>
              <Divider />
              <Form.Item label="Tartib" name="order">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
              <Form.Item label="Target" name="openInNewTab">
                <Radio.Group>
                  <Radio value={false}>Sayt ichida</Radio>
                  <Radio value={true}>Yangi tab</Radio>
                </Radio.Group>
              </Form.Item>
            </PublishCard>
          }
        />
      </Form>
    </FormPageShell>
  );
}
