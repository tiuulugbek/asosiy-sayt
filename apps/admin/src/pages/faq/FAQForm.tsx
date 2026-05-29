import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Form, Input, InputNumber, Switch, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FormPageShell from '../../components/common/FormPageShell';
import { PublishCard } from '../../components/common/FormLayout';
import LangTabs from '../../components/common/LangTabs';
import RichTextEditor from '../../components/RichTextEditor';
import { useFormPage } from '../../hooks/useFormPage';
import { createFaq, updateFaq, getFaqsAdmin, type CreateFaqPayload, ApiError } from '../../lib/api';

export default function FAQForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEditing = Boolean(id);

  const { data: faqs } = useQuery({ queryKey: ['faqs-admin'], queryFn: getFaqsAdmin });
  const faq = useMemo(() => faqs?.find((f) => f.id === id), [faqs, id]);

  useEffect(() => {
    if (!faq) return;
    form.setFieldsValue({
      question_uz: faq.question_uz,
      question_ru: faq.question_ru,
      answer_uz: faq.answer_uz,
      answer_ru: faq.answer_ru,
      order: faq.order,
      status: faq.status,
    });
  }, [faq, form]);

  const { mutateAsync: save, isPending: saving } = useMutation({
    mutationFn: async (payload: CreateFaqPayload) =>
      isEditing && id ? updateFaq(id, payload) : createFaq(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs-admin'] });
      message.success('Savol-javob saqlandi');
      navigate('/faq');
    },
    onError: (e: ApiError) => message.error(e.message || 'Xatolik'),
  });

  const handleSave = async () => {
    const v = await form.validateFields();
    await save({
      question_uz: v.question_uz,
      question_ru: v.question_ru,
      answer_uz: v.answer_uz,
      answer_ru: v.answer_ru,
      order: Number(v.order ?? 0),
      status: v.status,
    });
  };

  const { handleCancel } = useFormPage('/faq', handleSave);
  const isPublished = Form.useWatch('status', form) === 'published';

  return (
    <FormPageShell title={isEditing ? 'Savolni tahrirlash' : 'Yangi savol'} backTo="/faq">
      <div className="mx-auto max-w-2xl">
        <Form form={form} layout="vertical" initialValues={{ status: 'published', order: 0 }}>
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
            <LangTabs>
              {(lang) => (
                <>
                  <Form.Item
                    label={`Savol (${lang})`}
                    name={lang === 'uz' ? 'question_uz' : 'question_ru'}
                    rules={[{ required: true }]}
                  >
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item
                    label={`Javob (${lang})`}
                    name={lang === 'uz' ? 'answer_uz' : 'answer_ru'}
                    rules={[{ required: true }]}
                    valuePropName="value"
                    trigger="onChange"
                  >
                    <RichTextEditor placeholder="Javob" />
                  </Form.Item>
                </>
              )}
            </LangTabs>
            <Form.Item label="Tartib" name="order">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
            <div className="flex items-center justify-between">
              <span>{isPublished ? '✅ Nashr' : '📝 Qoralama'}</span>
              <Switch
                checked={isPublished}
                onChange={(c) => form.setFieldsValue({ status: c ? 'published' : 'draft' })}
              />
            </div>
          </PublishCard>
        </Form>
      </div>
    </FormPageShell>
  );
}
