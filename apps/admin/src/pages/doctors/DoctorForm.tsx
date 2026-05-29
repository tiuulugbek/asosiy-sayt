import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Checkbox, Col, Form, Input, InputNumber, Row, Select, Switch, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FormPageShell from '../../components/common/FormPageShell';
import FormLayout, { PublishCard } from '../../components/common/FormLayout';
import LangTabs from '../../components/common/LangTabs';
import ImagePickerField from '../../components/common/ImagePickerField';
import RichTextEditor from '../../components/RichTextEditor';
import { useFormPage } from '../../hooks/useFormPage';
import {
  createDoctor,
  updateDoctor,
  getDoctors,
  getBranches,
  type CreateDoctorPayload,
  ApiError,
} from '../../lib/api';
import { createSlug } from '../../utils/slug';
import { normalizeImageUrl } from '../../utils/image';

const languageOptions = ["O'zbek", 'Rus', 'Ingliz', "Qoraqalpoq"];

export default function DoctorForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEditing = Boolean(id);
  const [imageId, setImageId] = useState<string | undefined>();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data: doctors } = useQuery({ queryKey: ['doctors'], queryFn: getDoctors });
  const { data: branches } = useQuery({ queryKey: ['branches'], queryFn: getBranches });
  const doctor = useMemo(() => doctors?.find((d) => d.id === id), [doctors, id]);

  useEffect(() => {
    if (!doctor) return;
    form.setFieldsValue({
      name_uz: doctor.name_uz,
      name_ru: doctor.name_ru,
      position_uz: doctor.position_uz,
      position_ru: doctor.position_ru,
      description_uz: doctor.description_uz,
      description_ru: doctor.description_ru,
      slug: doctor.slug,
      branchIds: doctor.branchIds,
      patientTypes: doctor.patientTypes,
      order: doctor.order,
      status: doctor.status,
    });
    setImageId(doctor.image?.id);
    setImageUrl(doctor.image?.url ? normalizeImageUrl(doctor.image.url) : null);
  }, [doctor, form]);

  const { mutateAsync: save, isPending: saving } = useMutation({
    mutationFn: async (payload: CreateDoctorPayload) =>
      isEditing && id ? updateDoctor(id, payload) : createDoctor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      message.success('Mutaxassis saqlandi');
      navigate('/doctors');
    },
    onError: (e: ApiError) => message.error(e.message || 'Xatolik'),
  });

  const handleSave = async () => {
    const v = await form.validateFields();
    await save({
      name_uz: v.name_uz,
      name_ru: v.name_ru,
      position_uz: v.position_uz,
      position_ru: v.position_ru,
      description_uz: v.description_uz,
      description_ru: v.description_ru,
      slug: v.slug,
      branchIds: v.branchIds,
      patientTypes: v.patientTypes,
      order: Number(v.order ?? 0),
      status: v.status,
      imageId: imageId || undefined,
    });
  };

  const { handleCancel } = useFormPage('/doctors', handleSave);
  const isPublished = Form.useWatch('status', form) === 'published';

  return (
    <FormPageShell
      title={isEditing ? doctor?.name_uz ?? 'Mutaxassis' : 'Yangi mutaxassis'}
      backTo="/doctors"
    >
      <Form form={form} layout="vertical" initialValues={{ status: 'published', order: 0 }}>
        <FormLayout
          left={
            <Card title="Shaxsiy ma'lumot">
              <LangTabs>
                {(lang) => (
                  <>
                    <Form.Item
                      label={`To'liq ismi (${lang})`}
                      name={lang === 'uz' ? 'name_uz' : 'name_ru'}
                      rules={[{ required: true }]}
                    >
                      <Input
                        onChange={
                          lang === 'uz'
                            ? (e) => {
                                const n = e.target.value;
                                if (!form.getFieldValue('slug')) form.setFieldsValue({ slug: createSlug(n) });
                              }
                            : undefined
                        }
                      />
                    </Form.Item>
                    <Form.Item
                      label={`Lavozimi (${lang})`}
                      name={lang === 'uz' ? 'position_uz' : 'position_ru'}
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="Audiolog, LOR-shifokor..." />
                    </Form.Item>
                    <Form.Item
                      label={`Bio (${lang})`}
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
              <Form.Item label="Tillar" name="patientTypes">
                <Checkbox.Group options={languageOptions} />
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
                <div className="mb-4 flex items-center justify-between">
                  <span>{isPublished ? '✅ Nashr' : '📝 Qoralama'}</span>
                  <Switch
                    checked={isPublished}
                    onChange={(c) => form.setFieldsValue({ status: c ? 'published' : 'draft' })}
                  />
                </div>
                <Form.Item label="Filiallar" name="branchIds">
                  <Select
                    mode="multiple"
                    placeholder="Filiallar"
                    options={(branches ?? []).map((b) => ({ label: b.name_uz, value: b.id }))}
                  />
                </Form.Item>
                <Form.Item label="Tartib" name="order">
                  <InputNumber min={0} className="w-full" />
                </Form.Item>
              </PublishCard>
              <Card title="Foto" className="mt-4">
                <div className="mx-auto w-32 overflow-hidden rounded-full">
                  <ImagePickerField
                    value={imageId}
                    previewUrl={imageUrl}
                    onChange={(mid, url) => {
                      setImageId(mid);
                      setImageUrl(url ?? null);
                    }}
                    hint="400×400px"
                    aspectClass="aspect-square"
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
