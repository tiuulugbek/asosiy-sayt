import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationTagsService {
  constructor(private prisma: PrismaService) {}

  async search(q?: string) {
    const posts = await this.prisma.post.findMany({
      select: { tags: true },
    });
    const all = new Set<string>();
    for (const p of posts) {
      for (const t of p.tags || []) {
        if (t?.trim()) all.add(t.trim());
      }
    }
    let tags = [...all].sort((a, b) => a.localeCompare(b));
    if (q?.trim()) {
      const needle = q.trim().toLowerCase();
      tags = tags.filter((t) => t.toLowerCase().includes(needle));
    }
    return tags.map((name) => ({
      id: name,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
    }));
  }
}
