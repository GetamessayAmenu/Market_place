import { Injectable } from '@nestjs/common';
import type { Attribute, Prisma } from '@prisma/client';

import {
  BaseRepository,
  type PrismaModelDelegate,
} from '../../infrastructure/database/base.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class AttributesRepository extends BaseRepository<Attribute> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.attribute as unknown as PrismaModelDelegate);
  }

  async findAll(params: {
    where?: Prisma.AttributeWhereInput;
    orderBy?: Prisma.AttributeOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    const { where, orderBy, skip, take } = params;
    return this.prisma.attribute.findMany({
      ...(where !== undefined ? { where } : {}),
      ...(orderBy !== undefined ? { orderBy } : {}),
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
    });
  }

  async count(where?: Prisma.AttributeWhereInput): Promise<number> {
    if (where !== undefined) {
      return this.prisma.attribute.count({ where });
    }
    return this.prisma.attribute.count();
  }

  async findById(id: string): Promise<Attribute | null> {
    return this.prisma.attribute.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.AttributeCreateInput): Promise<Attribute> {
    return this.prisma.attribute.create({ data });
  }

  async update(id: string, data: Prisma.AttributeUpdateInput): Promise<Attribute> {
    return this.prisma.attribute.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<Attribute> {
    return this.prisma.attribute.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
