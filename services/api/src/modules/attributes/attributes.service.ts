import { Injectable } from '@nestjs/common';
import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { AttributeQueryDto } from './dto/attribute-query.dto';
import type { CreateAttributeDto } from './dto/create-attribute.dto';
import type { UpdateAttributeDto } from './dto/update-attribute.dto';
import { AttributesRepository } from './attributes.repository';

export interface SerializedAttribute {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly values: readonly string[];
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

@Injectable()
export class AttributesService {
  constructor(
    private readonly attributesRepository: AttributesRepository,
    private readonly adminLogsService: AdminLogsService,
  ) {}

  async findAll(query: AttributeQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(query.type !== undefined ? { type: query.type } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search !== undefined
        ? { name: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
    };

    const orderBy = { sortOrder: 'asc' as const, name: 'asc' as const };

    const [items, total] = await Promise.all([
      this.attributesRepository.findAll({ where, orderBy, skip, take: limit }),
      this.attributesRepository.count(where),
    ]);

    return toPaginatedResponse({
      items: items.map((attr) => this.serializeAttribute(attr)),
      total,
      page,
      limit,
    });
  }

  async findOne(id: string): Promise<SerializedAttribute> {
    const attribute = await this.attributesRepository.findById(id);
    if (!attribute || attribute.deletedAt) {
      throw new Error('Attribute not found');
    }
    return this.serializeAttribute(attribute);
  }

  async create(dto: CreateAttributeDto, userId: string): Promise<SerializedAttribute> {
    const created = await this.attributesRepository.create({
      name: dto.name,
      type: dto.type,
      values: dto.values as any,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    } as any);

    await this.adminLogsService.createLog({
      actorId: userId,
      action: 'attribute.created',
      resource: 'attribute',
      resourceId: created.id,
      metadata: { name: created.name, type: created.type },
    });

    return this.serializeAttribute(created);
  }

  async update(
    id: string,
    dto: UpdateAttributeDto,
    userId: string,
  ): Promise<SerializedAttribute> {
    const existing = await this.attributesRepository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new Error('Attribute not found');
    }

    const updated = await this.attributesRepository.update(id, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.values !== undefined ? { values: dto.values as any } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });

    await this.adminLogsService.createLog({
      actorId: userId,
      action: 'attribute.updated',
      resource: 'attribute',
      resourceId: id,
      metadata: { changes: dto },
    });

    return this.serializeAttribute(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.attributesRepository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new Error('Attribute not found');
    }

    await this.attributesRepository.softDelete(id);

    await this.adminLogsService.createLog({
      actorId: userId,
      action: 'attribute.deleted',
      resource: 'attribute',
      resourceId: id,
      metadata: { name: existing.name },
    });
  }

  async reorder(id: string, newOrder: number, userId: string): Promise<SerializedAttribute> {
    const existing = await this.attributesRepository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new Error('Attribute not found');
    }

    const updated = await this.attributesRepository.update(id, {
      sortOrder: newOrder,
    });

    await this.adminLogsService.createLog({
      actorId: userId,
      action: 'attribute.reordered',
      resource: 'attribute',
      resourceId: id,
      metadata: { oldOrder: existing.sortOrder, newOrder },
    });

    return this.serializeAttribute(updated);
  }

  private serializeAttribute(attribute: any): SerializedAttribute {
    return {
      id: attribute.id,
      name: attribute.name,
      type: attribute.type,
      values: Array.isArray(attribute.values) ? attribute.values : [],
      sortOrder: attribute.sortOrder,
      isActive: attribute.isActive,
      createdAt: attribute.createdAt.toISOString(),
      updatedAt: attribute.updatedAt.toISOString(),
    };
  }
}
