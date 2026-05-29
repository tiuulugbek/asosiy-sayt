import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serviceSchema } from '@acoustic/shared';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(publicOnly = false, categoryId?: string) {
    const where: any = publicOnly ? { status: 'published' } : {};
    if (categoryId) {
      where.categoryId = categoryId;
    }
    return this.prisma.service.findMany({
      where,
      include: { cover: true, alternativeCover: true, category: true },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { cover: true, alternativeCover: true, category: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async findBySlug(slug: string) {
    const service = await this.prisma.service.findUnique({
      where: { slug, status: 'published' },
      include: { cover: true, alternativeCover: true, category: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async create(data: unknown) {
    const validated = this.parseInput(data);
    return this.prisma.service.create({
      data: {
        ...validated,
        coverId: validated.coverId ?? undefined,
        alternativeCoverId: validated.alternativeCoverId ?? undefined,
        categoryId: validated.categoryId ?? undefined,
      } as Prisma.ServiceUncheckedCreateInput,
      include: { cover: true, alternativeCover: true, category: true },
    });
  }

  async update(id: string, data: unknown) {
    const validated = this.parseInput(data, true);
    const updateData: Prisma.ServiceUncheckedUpdateInput = {
      ...validated,
      ...(validated.coverId !== undefined ? { coverId: validated.coverId } : {}),
      ...(validated.alternativeCoverId !== undefined ? { alternativeCoverId: validated.alternativeCoverId } : {}),
      ...(validated.categoryId !== undefined ? { categoryId: validated.categoryId } : {}),
    };

    return this.prisma.service.update({
      where: { id },
      data: updateData,
      include: { cover: true, alternativeCover: true, category: true },
    });
  }

  async delete(id: string) {
    return this.prisma.service.delete({
      where: { id },
    });
  }

  private parseInput(data: unknown, partial = false) {
    try {
      return partial ? serviceSchema.partial().parse(data) : serviceSchema.parse(data);
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
}
