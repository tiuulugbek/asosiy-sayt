import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Collapse, DatePicker, Form, Input, Select, Switch, message } from 'antd';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FormPageShell from '../../components/common/FormPageShell';
import FormLayout, { PublishCard } from '../../components/common/FormLayout';
import LangTabs from '../../components/common/LangTabs';
import ImagePickerField from '../../components/common/ImagePickerField';
import RichTextEditor from '../../components/RichTextEditor';
import { useFormPage } from '../../hooks/useFormPage';
import {
  createPost,
  updatePost,
  getPosts,
  getPostCategories,
  type CreatePostPayload,
  ApiError,
} from '../../lib/api';
import { createSlug } from '../../utils/slug';
import { normalizeImageUrl } from '../../utils/image';

interface PostFormProps {
  backPath?: string;
  categorySection?: string;
}

export default function PostForm({ backPath = '/posts', categorySection }: PostFormProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEditing = Boolean(id);
  const [coverId, setCoverId] = useState<string | undefined>();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const { data: posts } = useQuery({ queryKey: ['posts'], queryFn: getPosts });
  const { data: categories } = useQuery({
    queryKey: ['post-categories', categorySection],
    queryFn: () => getPostCategories(categorySection),
  });
  const post = useMemo(() => posts?.find((p) => p.id === id), [posts, id]);

  useEffect(() => {
    if (!post) return;
    form.setFieldsValue({
      title_uz: post.title_uz,
      title_ru: post.title_ru,
      excerpt_uz: post.excerpt_uz,
      excerpt_ru: post.excerpt_ru,
      body_uz: post.body_uz,
      body_ru: post.body_ru,
      slug: post.slug,
      postType: post.postType ?? 'article',
      categoryId: post.categoryId,
      tags: post.tags,
      status: post.status,
      publishAt: post.publishAt ? dayjs(post.publishAt) : undefined,
    });
    setCoverId(post.cover?.id);
    setCoverUrl(post.cover?.url ? normalizeImageUrl(post.cover.url) : null);
  }, [post, form]);

  const { mutateAsync: save, isPending: saving } = useMutation({
    mutationFn: async (payload: CreatePostPayload) =>
      isEditing && id ? updatePost(id, payload) : createPost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      message.success('Maqola saqlandi');
      navigate(backPath);
    },
    onError: (e: ApiError) => message.error(e.message || 'Xatolik'),
  });

  const handleSave = async () => {
    const v = await form.validateFields();
    await save({
      title_uz: v.title_uz,
      title_ru: v.title_ru,
      excerpt_uz: v.excerpt_uz,
      excerpt_ru: v.excerpt_ru,
      body_uz: v.body_uz,
      body_ru: v.body_ru,
      slug: v.slug,
      postType: v.postType,
      categoryId: v.categoryId,
      tags: v.tags ?? [],
      status: v.status,
      publishAt: v.publishAt ? v.publishAt.toISOString() : new Date().toISOString(),
      coverId: coverId || undefined,
    });
  };

  const { handleCancel } = useFormPage(backPath, handleSave);
  const isPublished = Form.useWatch('status', form) === 'published';

  return (
    <FormPageShell title={isEditing ? post?.title_uz ?? 'Maqola' : 'Yangi yangilik'} backTo={backPath}>
      <Form form={form} layout="vertical" initialValues={{ status: 'published', postType: 'article', tags: [] }}>
        <FormLayout
          left={
            <>
              <Card title="Kontent">
                <LangTabs>
                  {(lang) => (
                    <>
                      <Form.Item
                        label={`Sarlavha (${lang})`}
                        name={lang === 'uz' ? 'title_uz' : 'title_ru'}
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
                      <Form.Item label={`Qisqa (${lang})`} name={lang === 'uz' ? 'excerpt_uz' : 'excerpt_ru'}>
                        <Input.TextArea rows={3} maxLength={300} showCount />
                      </Form.Item>
                      <Form.Item
                        label={`Mazmun (${lang})`}
                        name={lang === 'uz' ? 'body_uz' : 'body_ru'}
                        rules={[{ required: true }]}
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
              <Card title="Featured rasm" className="mt-4">
                <ImagePickerField
                  value={coverId}
                  previewUrl={coverUrl}
                  onChange={(mid, url) => {
                    setCoverId(mid);
                    setCoverUrl(url ?? null);
                  }}
                  hint="1200×630px"
                  aspectClass="aspect-video w-full max-w-xl"
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
              <Form.Item label="Kategoriya" name="categoryId" rules={[{ required: true }]}>
                <Select
                  showSearch
                  options={(categories ?? []).map((c) => ({ label: c.name_uz, value: c.id }))}
                />
              </Form.Item>
              <Form.Item label="Teglar" name="tags">
                <Select mode="tags" placeholder="Teglar" />
              </Form.Item>
              <Form.Item label="Nashr sanasi" name="publishAt">
                <DatePicker showTime className="w-full" />
              </Form.Item>
            </PublishCard>
          }
        />
      </Form>
    </FormPageShell>
  );
}
