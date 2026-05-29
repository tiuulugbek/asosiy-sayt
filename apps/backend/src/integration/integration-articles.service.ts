import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PostsService } from '../posts/posts.service';
import { MediaService } from '../media/media.service';
import { IntegrationWebhookService } from './integration-webhook.service';
import {
  articleCreateSchema,
  articleUpdateSchema,
  type ArticleCreateDto,
  type ArticleUpdateDto,
} from './dto/article.dto';
import { ensureUniqueSlug, markdownToHtml, slugify } from './integration.utils';
import { ZodError } from 'zod';

type AuthUser = {
  id: string;
  role: { name: string; permissions: string[] };
};

@Injectable()
export class IntegrationArticlesService {
  constructor(
    private prisma: PrismaService,
    private postsService: PostsService,
    private mediaService: MediaService,
    private webhook: IntegrationWebhookService,
    private config: ConfigService,
  ) {}

  private publicBaseUrl(): string {
    return this.config.get<string>('NEXT_PUBLIC_SITE_URL', 'https://acoustic.uz').replace(/\/$/, '');
  }

  private articleUrl(slug: string): string {
    return `${this.publicBaseUrl()}/posts/${slug}`;
  }

  private mapPostResponse(post: {
    id: string;
    slug: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    publishAt: Date;
    title_uz: string;
  }) {
    return {
      id: post.id,
      slug: post.slug,
      url: this.articleUrl(post.slug),
      status: post.status,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      publishedAt: post.publishAt?.toISOString?.() ?? post.publishAt,
      title: post.title_uz,
    };
  }

  private parseCreate(data: unknown): ArticleCreateDto {
    try {
      return articleCreateSchema.parse(data);
    } catch (e) {
      if (e instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const err of e.errors) {
          fields[err.path.join('.') || 'body'] = err.message;
        }
        throw new BadRequestException({
          error: 'ValidationError',
          message: 'So\'rov ma\'lumotlari noto\'g\'ri',
          fields,
        });
      }
      throw e;
    }
  }

  private parseUpdate(data: unknown): ArticleUpdateDto {
    try {
      return articleUpdateSchema.parse(data);
    } catch (e) {
      if (e instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const err of e.errors) {
          fields[err.path.join('.') || 'body'] = err.message;
        }
        throw new BadRequestException({
          error: 'ValidationError',
          message: 'So\'rov ma\'lumotlari noto\'g\'ri',
          fields,
        });
      }
      throw e;
    }
  }

  private async resolveCategoryId(dto: {
    categoryId?: string;
    categorySlug?: string;
  }): Promise<string> {
    if (dto.categoryId) {
      const cat = await this.prisma.postCategory.findUnique({ where: { id: dto.categoryId } });
      if (!cat) {
        throw new BadRequestException({
          error: 'ValidationError',
          message: 'Kategoriya topilmadi',
          fields: { categoryId: 'Mavjud emas' },
        });
      }
      return cat.id;
    }

    const slug =
      dto.categorySlug ||
      this.config.get<string>('ACOUSTIC_DEFAULT_CATEGORY_SLUG', 'eshitish-muammolari');

    const cat = await this.prisma.postCategory.findFirst({
      where: { slug, status: 'published' },
    });
    if (!cat) {
      throw new BadRequestException({
        error: 'ValidationError',
        message: 'Kategoriya topilmadi',
        fields: { categorySlug: `"${slug}" mavjud emas` },
      });
    }
    return cat.id;
  }

  private async resolveCoverId(
    coverImageUrl?: string,
    coverImageAlt?: string,
  ): Promise<string | undefined> {
    if (!coverImageUrl) return undefined;
    const media = await this.mediaService.createFromUrl(coverImageUrl, coverImageAlt, coverImageAlt);
    return media.id;
  }

  private async buildPostPayload(
    dto: ArticleCreateDto | ArticleUpdateDto,
    userId: string,
    existing?: { slug: string; id: string },
  ) {
    const title = dto.title;
    const content = dto.content;
    const html =
      content && dto.contentFormat === 'markdown' ? markdownToHtml(content) : content;

    let slug = dto.slug ? slugify(dto.slug) : undefined;
    if (!slug && title) {
      slug = slugify(title);
    }
    if (!slug && existing) {
      slug = existing.slug;
    }
    if (!slug) {
      slug = 'post';
    }

    if (dto.slug && !existing) {
      const taken = await this.prisma.post.findUnique({ where: { slug } });
      if (taken) {
        const suggested = await ensureUniqueSlug(this.prisma, slug);
        throw new ConflictException({
          error: 'Conflict',
          message: 'Bu slug band',
          suggested_slug: suggested,
        });
      }
    } else if (!dto.slug || !existing) {
      slug = await ensureUniqueSlug(this.prisma, slug, existing?.id);
    } else if (existing && dto.slug) {
      const newSlug = slugify(dto.slug);
      if (newSlug !== existing.slug) {
        const taken = await this.prisma.post.findUnique({ where: { slug: newSlug } });
        if (taken && taken.id !== existing.id) {
          const suggested = await ensureUniqueSlug(this.prisma, newSlug, existing.id);
          throw new ConflictException({
            error: 'Conflict',
            message: 'Bu slug band',
            suggested_slug: suggested,
          });
        }
      }
      slug = newSlug;
    }

    const excerpt =
      dto.excerpt ||
      (html ? html.replace(/<[^>]+>/g, '').trim().slice(0, 300) : undefined);

    const categoryId =
      dto.categoryId || dto.categorySlug
        ? await this.resolveCategoryId(dto)
        : existing
          ? undefined
          : await this.resolveCategoryId({});

    const coverId = dto.coverImageUrl
      ? await this.resolveCoverId(dto.coverImageUrl, dto.coverImageAlt)
      : undefined;

    const payload: Record<string, unknown> = {
      createdByUserId: userId,
      postType: 'article',
    };

    if (title) {
      payload.title_uz = title;
      payload.title_ru = title;
    }
    if (html) {
      payload.body_uz = html;
      payload.body_ru = html;
    }
    if (slug) payload.slug = slug;
    if (excerpt !== undefined) {
      payload.excerpt_uz = excerpt;
      payload.excerpt_ru = excerpt;
    }
    if (categoryId) payload.categoryId = categoryId;
    if (dto.tags) payload.tags = dto.tags;
    if (dto.status) payload.status = dto.status;
    if (dto.publishedAt !== undefined) {
      payload.publishAt = dto.publishedAt ?? new Date();
    } else if (dto.status === 'published') {
      payload.publishAt = new Date();
    }
    if (coverId) payload.coverId = coverId;

    return payload;
  }

  async create(data: unknown, user: AuthUser) {
    this.assertWrite(user);
    const dto = this.parseCreate(data);
    const payload = await this.buildPostPayload(dto, user.id);
    const post = await this.postsService.create(payload);

    if (post.status === 'published') {
      await this.webhook.notifyArticlePublished({
        id: post.id,
        slug: post.slug,
        title: post.title_uz,
        url: this.articleUrl(post.slug),
        publishedAt: new Date(post.publishAt).toISOString(),
        authorId: user.id,
      });
    }

    return this.mapPostResponse(post);
  }

  async update(id: string, data: unknown, user: AuthUser) {
    this.assertWrite(user);
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        error: 'NotFound',
        message: 'Maqola topilmadi',
      });
    }
    if (existing.createdByUserId && existing.createdByUserId !== user.id) {
      const isAdmin = user.role.permissions.includes('*') || user.role.name === 'admin';
      if (!isAdmin) {
        throw new ForbiddenException({
          error: 'Forbidden',
          message: 'Bu maqolani tahrirlash huquqi yo\'q',
        });
      }
    }

    const dto = this.parseUpdate(data);
    const payload = await this.buildPostPayload(dto, user.id, existing);
    delete payload.createdByUserId;
    const post = await this.postsService.update(id, payload);

    if (post.status === 'published') {
      await this.webhook.notifyArticlePublished({
        id: post.id,
        slug: post.slug,
        title: post.title_uz,
        url: this.articleUrl(post.slug),
        publishedAt: new Date(post.publishAt).toISOString(),
        authorId: user.id,
      });
    }

    return {
      ...this.mapPostResponse(post),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  async list(
    user: AuthUser,
    query: { author?: string; status?: string; limit?: string; page?: string },
  ) {
    const limit = Math.min(parseInt(query.limit || '20', 10) || 20, 100);
    const page = Math.max(parseInt(query.page || '1', 10) || 1, 1);
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {};
    if (query.author === 'me') {
      where.createdByUserId = user.id;
    }
    if (query.status === 'draft' || query.status === 'published') {
      where.status = query.status;
    }
    where.postType = 'article';

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          slug: true,
          status: true,
          publishAt: true,
          createdAt: true,
          updatedAt: true,
          title_uz: true,
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: data.map((p) => ({
        id: p.id,
        title: p.title_uz,
        slug: p.slug,
        url: this.articleUrl(p.slug),
        status: p.status,
        publishedAt: p.publishAt.toISOString(),
        createdAt: p.createdAt.toISOString(),
      })),
      meta: { total, page, pageSize: limit },
    };
  }

  async remove(id: string, user: AuthUser) {
    this.assertWrite(user);
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        error: 'NotFound',
        message: 'Maqola topilmadi',
      });
    }
    if (existing.createdByUserId && existing.createdByUserId !== user.id) {
      const isAdmin = user.role.permissions.includes('*') || user.role.name === 'admin';
      if (!isAdmin) {
        throw new ForbiddenException({
          error: 'Forbidden',
          message: 'Bu maqolani o\'chirish huquqi yo\'q',
        });
      }
    }
    await this.postsService.delete(id);
  }

  private assertWrite(user: AuthUser) {
    const perms = user.role.permissions;
    if (perms.includes('*') || perms.includes('content.write') || perms.some((p) => p === 'content.*')) {
      return;
    }
    throw new ForbiddenException({
      error: 'Forbidden',
      message: 'Maqola yozish huquqi yo\'q',
    });
  }
}
