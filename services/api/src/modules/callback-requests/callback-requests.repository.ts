import { Injectable } from '@nestjs/common';
import type { CallbackRequest, Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class CallbackRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CallbackRequestUncheckedCreateInput): Promise<CallbackRequest> {
    return this.prisma.callbackRequest.create({
      data,
    });
  }

  async findById(id: string): Promise<CallbackRequest | null> {
    return this.prisma.callbackRequest.findUnique({
      where: { id },
    });
  }

  async findBySeller(sellerId: string): Promise<readonly CallbackRequest[]> {
    return this.prisma.callbackRequest.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByListing(listingId: string): Promise<readonly CallbackRequest[]> {
    return this.prisma.callbackRequest.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
