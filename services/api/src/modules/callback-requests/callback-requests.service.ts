import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CallbackRequestsRepository } from './callback-requests.repository';
import { CreateCallbackRequestDto } from './dto/create-callback-request.dto';

@Injectable()
export class CallbackRequestsService {
  constructor(
    private readonly repository: CallbackRequestsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateCallbackRequestDto) {
    // 1. Verify listing exists
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // 2. Verify seller exists and matches listing
    const seller = await this.prisma.user.findUnique({
      where: { id: dto.sellerId },
    });
    if (!seller || listing.sellerId !== dto.sellerId) {
      throw new NotFoundException('Seller not found or does not match listing');
    }

    // 3. Save callback request
    const callbackRequest = await this.repository.create({
      listingId: dto.listingId,
      sellerId: dto.sellerId,
      buyerName: dto.name,
      buyerPhone: dto.phone,
      preferredTime: dto.preferredTime ?? null,
      message: dto.message ?? null,
    });

    return {
      success: true,
      id: callbackRequest.id,
    };
  }
}
