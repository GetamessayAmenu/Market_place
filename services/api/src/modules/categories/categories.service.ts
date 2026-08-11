import { ConflictException, Injectable } from '@nestjs/common';
import { slugify } from '@marketplace/utils';
import { Prisma } from '@prisma/client';

import { CategoryNotFoundException } from '../listings/exceptions/listing.exceptions';
import { CategoriesRepository, type CategoryWithChildren } from './categories.repository';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';

export interface SerializedCategory {
  readonly id: string;
  readonly name: string;
  readonly nameAm: string | null;
  readonly slug: string;
  readonly slugAm: string | null;
  readonly description: string | null;
  readonly descriptionAm: string | null;
  readonly parentId: string | null;
  readonly type: string;
  readonly iconUrl: string | null;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly children?: readonly SerializedCategory[];
}

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  async listCategories(): Promise<readonly SerializedCategory[]> {
    const tree = await this.categoriesRepository.findActiveTree();
    return tree.map((c) => this.serializeCategory(c));
  }

  async getCategoryBySlug(slug: string): Promise<SerializedCategory> {
    const category = await this.categoriesRepository.findBySlug(slug);
    if (!category) {
      throw new CategoryNotFoundException();
    }
    return this.serializeCategory(category);
  }

  async getRegionalHubs() {
    const hubs = await this.categoriesRepository.findRegionalHubs();
    return hubs.map(hub => ({
      id: hub.id,
      name: hub.name,
      nameAm: hub.nameAm,
      description: hub.description,
      descriptionAm: hub.descriptionAm,
      type: hub.type,
      city: hub.city,
      cityAm: hub.cityAm,
      coordinates: hub.coordinates,
      sortOrder: hub.sortOrder,
      isActive: hub.isActive,
      isPopular: hub.isPopular,
    }));
  }

  async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categoriesRepository.findByIdActive(categoryId);
    if (!category) {
      throw new CategoryNotFoundException();
    }
  }

  async create(dto: CreateCategoryDto): Promise<SerializedCategory> {
    const slug = dto.slug || slugify(dto.name);
    if (await this.categoriesRepository.slugExists(slug)) {
      throw new ConflictException({ code: 'CATEGORY_SLUG_EXISTS', message: 'Slug already in use' });
    }
    if (dto.parentId) {
      await this.assertCategoryExists(dto.parentId);
    }
    const created = await this.categoriesRepository.create({
      name: dto.name,
      slug,
      ...(dto.parentId ? { parent: { connect: { id: dto.parentId } } } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.iconUrl !== undefined ? { iconUrl: dto.iconUrl } : {}),
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    return this.serializeCategory(created);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<SerializedCategory> {
    const existing = await this.categoriesRepository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new CategoryNotFoundException();
    }
    if (dto.slug && (await this.categoriesRepository.slugExists(dto.slug, id))) {
      throw new ConflictException({ code: 'CATEGORY_SLUG_EXISTS', message: 'Slug already in use' });
    }
    if (dto.parentId) {
      await this.assertCategoryExists(dto.parentId);
    }
    const updated = await this.categoriesRepository.update(id, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      ...(dto.parentId !== undefined
        ? dto.parentId === null
          ? { parent: { disconnect: true } }
          : { parent: { connect: { id: dto.parentId } } }
        : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.iconUrl !== undefined ? { iconUrl: dto.iconUrl } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
    return this.serializeCategory(updated);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.categoriesRepository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new CategoryNotFoundException();
    }
    await this.categoriesRepository.softDelete(id);
  }

  async findAllAdmin(query: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
    isActive?: boolean;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
      ...(query.type !== undefined ? { type: query.type as any } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search !== undefined
        ? { name: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
    };

    const items = await (this.categoriesRepository as any).findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await (this.categoriesRepository as any).count(where);

    return {
      success: true,
      data: items.map((c: any) => this.serializeCategory(c)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneAdmin(id: string) {
    const category = await this.categoriesRepository.findById(id);
    if (!category || category.deletedAt) {
      throw new CategoryNotFoundException();
    }
    return {
      success: true,
      data: this.serializeCategory(category as any),
    };
  }

  private serializeCategory(category: CategoryWithChildren): SerializedCategory {
    return {
      id: category.id,
      name: category.name,
      nameAm: (category as any).nameAm || null,
      slug: category.slug,
      slugAm: (category as any).slugAm || null,
      description: (category as any).description || null,
      descriptionAm: (category as any).descriptionAm || null,
      parentId: category.parentId,
      type: (category as any).type || 'product',
      iconUrl: category.iconUrl,
      sortOrder: category.sortOrder,
      isActive: (category as any).isActive ?? true,
      ...(category.children?.length
        ? { children: category.children.map((c) => this.serializeCategory(c)) }
        : {}),
    };
  }
}
