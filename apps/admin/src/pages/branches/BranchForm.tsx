import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Switch, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FormPageShell from '../../components/common/FormPageShell';
import FormLayout, { PublishCard } from '../../components/common/FormLayout';
import LangTabs from '../../components/common/LangTabs';
import ImagePickerField from '../../components/common/ImagePickerField';
import { useFormPage } from '../../hooks/useFormPage';
import {
  createBranch,
  updateBranch,
  getBranches,
  type CreateBranchPayload,
  ApiError,
} from '../../lib/api';
import { normalizeImageUrl } from '../../utils/image';

const cities = [
  'Toshkent', 'Samarqand', 'Buxoro', 'Namangan', "Farg'ona", 'Andijon', 'Navoiy', 'Qarshi', 'Nukus', 'Boshqa',
];

export default function BranchForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEditing = Boolean(id);
  const [imageId, setImageId] = useState<string | undefined>();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data: branches } = useQuery({ queryKey: ['branches'], queryFn: getBranches });
  const branch = useMemo(() => branches?.find((b) => b.id === id), [branches, id]);

  useEffect(() => {
    if (!branch) return;
    form.setFieldsValue({
      name_uz: branch.name_uz,
      name_ru: branch.name_ru,
      address_uz: branch.address_uz,
      address_ru: branch.address_ru,
      phone: branch.phone,
      workingHours_uz: branch.workingHours_uz,
      workingHours_ru: branch.workingHours_ru,
      latitude: branch.latitude,
      longitude: branch.longitude,
      order: branch.order,
      city: 'Toshkent',
    });
    setImageId(branch.image?.id);
    setImageUrl(branch.image?.url ? normalizeImageUrl(branch.image.url) : null);
  }, [branch, form]);

  const { mutateAsync: save, isPending: saving } = useMutation({
    mutationFn: async (payload: CreateBranchPayload) =>
      isEditing && id ? updateBranch(id, payload) : createBranch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      message.success('Filial saqlandi');
      navigate('/branches');
    },
    onError: (e: ApiError) => message.error(e.message || 'Xatolik'),
  });

  const handleSave = async () => {
    const v = await form.validateFields();
    await save({
      name_uz: v.name_uz,
      name_ru: v.name_ru,
      address_uz: v.address_uz,
      address_ru: v.address_ru,
      phone: v.phone,
      workingHours_uz: v.workingHours_uz,
      workingHours_ru: v.workingHours_ru,
      latitude: v.latitude,
      longitude: v.longitude,
      order: Number(v.order ?? 0),
      imageId: imageId || undefined,
    });
  };

  const { handleCancel } = useFormPage('/branches', handleSave);
  const lat = Form.useWatch('latitude', form);
  const lng = Form.useWatch('longitude', form);

  return (
    <FormPageShell title={isEditing ? branch?.name_uz ?? 'Filial' : 'Yangi filial'} backTo="/branches">
      <Form form={form} layout="vertical" initialValues={{ order: 0 }}>
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
                        <Input />
                      </Form.Item>
                      <Form.Item
                        label={`Manzil (${lang})`}
                        name={lang === 'uz' ? 'address_uz' : 'address_ru'}
                        rules={[{ required: true }]}
                      >
                        <Input.TextArea rows={2} />
                      </Form.Item>
                      <Form.Item
                        label={`Ish vaqti (${lang})`}
                        name={lang === 'uz' ? 'workingHours_uz' : 'workingHours_ru'}
                      >
                        <Input placeholder="9:00–18:00, Du–Sha" />
                      </Form.Item>
                    </>
                  )}
                </LangTabs>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Telefon" name="phone" rules={[{ required: true }]}>
                      <Input placeholder="+998..." />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Email" name="email">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
              <Card title="Joylashuv" className="mt-4">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Kenglik" name="latitude">
                      <InputNumber step={0.000001} className="w-full" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Uzunlik" name="longitude">
                      <InputNumber step={0.000001} className="w-full" />
                    </Form.Item>
                  </Col>
                </Row>
                {lat != null && lng != null && (
                  <Button
                    type="link"
                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    🗺 Google Xaritada ko&apos;rish
                  </Button>
                )}
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
                <Form.Item label="Shahar" name="city">
                  <Select options={cities.map((c) => ({ label: c, value: c }))} />
                </Form.Item>
                <Form.Item label="Tartib" name="order">
                  <InputNumber min={0} className="w-full" />
                </Form.Item>
              </PublishCard>
              <Card title="Rasm" className="mt-4">
                <ImagePickerField
                  value={imageId}
                  previewUrl={imageUrl}
                  onChange={(mid, url) => {
                    setImageId(mid);
                    setImageUrl(url ?? null);
                  }}
                  hint="800×600px"
                />
              </Card>
            </>
          }
        />
      </Form>
    </FormPageShell>
  );
}
