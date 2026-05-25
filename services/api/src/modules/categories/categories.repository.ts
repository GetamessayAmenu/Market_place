import { Injectable } from '@nestjs/common';
import type { Category, Prisma } from '@prisma/client';

import {
  BaseRepository,
  type PrismaModelDelegate,
} from '../../infrastructure/database/base.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export type CategoryWithChildren = Category & {
  readonly children?: readonly Category[];
};

@Injectable()
export class CategoriesRepository extends BaseRepository<Category> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.category as unknown as PrismaModelDelegate);
  }

  async findActiveTree(): Promise<CategoryWithChildren[]> {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const byParent = new Map<string | null, Category[]>();
    for (const cat of categories) {
      const key = cat.parentId;
      const list = byParent.get(key) ?? [];
      list.push(cat);
      byParent.set(key, list);
    }

    const attachChildren = (parentId: string | null): CategoryWithChildren[] => {
      const nodes = byParent.get(parentId) ?? [];
      return nodes.map((node) => ({
        ...node,
        children: attachChildren(node.id),
      }));
    };

    return attachChildren(null);
  }

  async findBySlug(slug: string): Promise<CategoryWithChildren | null> {
    const category = await this.prisma.category.findFirst({
      where: { slug, deletedAt: null, isActive: true },
      include: {
        children: {
          where: { deletedAt: null, isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
    return category;
  }

  async findByIdActive(id: string): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: { id, deletedAt: null, isActive: true },
    });
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const found = await this.prisma.category.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return found !== null;
  }

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
