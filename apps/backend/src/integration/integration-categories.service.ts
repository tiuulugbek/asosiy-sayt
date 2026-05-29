import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationCategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.postCategory.findMany({
      where: { status: 'published' },
      orderBy: { order: 'asc' },
      select: { id: true, name_uz: true, name_ru: true, slug: true, section: true },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name_uz,
      name_uz: r.name_uz,
      name_ru: r.name_ru,
      slug: r.slug,
      section: r.section,
    }));
  }
}
