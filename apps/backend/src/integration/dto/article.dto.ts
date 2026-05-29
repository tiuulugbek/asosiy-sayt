import { z } from 'zod';

export const articleCreateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  contentFormat: z.enum(['markdown', 'html']).default('markdown'),
  categoryId: z.string().optional(),
  categorySlug: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  coverImageUrl: z.string().url().optional(),
  coverImageAlt: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  publishedAt: z.coerce.date().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

export const articleUpdateSchema = articleCreateSchema.partial();

export type ArticleCreateDto = z.infer<typeof articleCreateSchema>;
export type ArticleUpdateDto = z.infer<typeof articleUpdateSchema>;
