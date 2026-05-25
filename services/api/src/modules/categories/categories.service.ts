import { ConflictException, Injectable } from '@nestjs/common';
import { slugify } from '@marketplace/utils';

import { CategoryNotFoundException } from '../listings/exceptions/listing.exceptions';
import { CategoriesRepository, type CategoryWithChildren } from './categories.repository';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';

export interface SerializedCategory {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly parentId: string | null;
  readonly iconUrl: string | null;
  readonly sortOrder: number;
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

  private serializeCategory(category: CategoryWithChildren): SerializedCategory {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      iconUrl: category.iconUrl,
      sortOrder: category.sortOrder,
      ...(category.children?.length
        ? { children: category.children.map((c) => this.serializeCategory(c)) }
        : {}),
    };
  }
}
