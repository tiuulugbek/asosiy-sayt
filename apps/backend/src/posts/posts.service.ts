import { BadRequestException, Injectable } from '@nestjs/common';
import { postSchema } from '@acoustic/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { z, ZodError } from 'zod';

type PostCreateInput = z.infer<typeof postSchema>;
type PostUpdateInput = z.infer<ReturnType<typeof postSchema.partial>>;

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  private parsePostInput(data: unknown): PostCreateInput;
  private parsePostInput(data: unknown, partial: true): PostUpdateInput;
  private parsePostInput(data: unknown, partial = false): PostCreateInput | PostUpdateInput {
    try {
      return partial ? postSchema.partial().parse(data) : postSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors
          .map((e) => `${e.path.length ? e.path.join('.') + ': ' : ''}${e.message}`)
          .join('; ');
        throw new BadRequestException(details || 'Ma\'lumotlar noto\'g\'ri');
      }
      throw error;
    }
  }

  async findAll(publicOnly = false, category?: string, postType?: string) {
    const where: Record<string, unknown> = publicOnly ? { status: 'published' } : {};
    if (category) {
      where.categoryId = category;
    }
    if (postType) {
      where.postType = postType;
    }
    return this.prisma.post.findMany({
      where,
      include: { cover: true, category: true, author: { include: { image: true } } },
      orderBy: { publishAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
      include: { cover: true, category: true, author: { include: { image: true } } },
    });
  }

  async findBySlug(slug: string, publicOnly = true) {
    return this.prisma.post.findFirst({
      where: {
        slug,
        ...(publicOnly && { status: 'published' }),
      },
      include: { cover: true, category: true, author: { include: { image: true } } },
    });
  }

  async create(data: unknown) {
    const validated = this.parsePostInput(data);
    try {
      return await this.prisma.post.create({
        data: validated as Prisma.PostUncheckedCreateInput,
        include: { cover: true, category: true, author: { include: { image: true } } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Bu slug allaqachon mavjud. Boshqa slug tanlang.');
      }
      throw error;
    }
  }

  async update(id: string, data: unknown) {
    const validated = this.parsePostInput(data, true);
    try {
      return await this.prisma.post.update({
        where: { id },
        data: validated as Prisma.PostUncheckedUpdateInput,
        include: { cover: true, category: true, author: { include: { image: true } } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Bu slug allaqachon mavjud. Boshqa slug tanlang.');
      }
      throw error;
    }
  }

  async delete(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }
}
