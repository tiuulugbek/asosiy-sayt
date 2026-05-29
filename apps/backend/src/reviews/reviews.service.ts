import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createReviewSchema, updateReviewSchema } from '@acoustic/shared';
@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(data: unknown) {
    const validated = createReviewSchema.parse(data);
    return this.prisma.review.create({
      data: {
        name: validated.name.trim(),
        rating: validated.rating,
        body: validated.body.trim(),
        status: 'pending',
      },
    });
  }

  async findPublished(limit = 50) {
    const take = Math.min(Math.max(limit, 1), 100);
    return this.prisma.review.findMany({
      where: { status: 'published' },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        name: true,
        rating: true,
        body: true,
        createdAt: true,
      },
    });
  }

  async findAllAdmin() {
    return this.prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, data: unknown) {
    const validated = updateReviewSchema.parse(data);
    const updateData: { status?: string; name?: string; rating?: number; body?: string } = {};
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.name !== undefined) updateData.name = validated.name.trim();
    if (validated.rating !== undefined) updateData.rating = validated.rating;
    if (validated.body !== undefined) updateData.body = validated.body.trim();
    if (Object.keys(updateData).length === 0) {
      throw new NotFoundException('No fields to update');
    }
    try {
      return await this.prisma.review.update({
        where: { id },
        data: updateData,
      });
    } catch {
      throw new NotFoundException('Review not found');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.review.delete({ where: { id } });
      return { success: true };
    } catch {
      throw new NotFoundException('Review not found');
    }
  }
}
