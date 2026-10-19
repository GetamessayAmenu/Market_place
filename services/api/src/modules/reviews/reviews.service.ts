import { Injectable } from '@nestjs/common';

import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { ListingsRepository } from '../listings/listings.repository';

import { CreateReviewDto } from './dto/create-review.dto';
import {
  CannotReviewOwnListingException,
  DuplicateReviewException,
  ReviewForbiddenException,
  ReviewNotFoundException,
} from './exceptions/review.exceptions';
import { ReviewsRepository } from './reviews.repository';
import { buildReviewSummary, serializeReview } from './serializers/review.serializer';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly listingsRepository: ListingsRepository,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateReviewDto) {
    const listing = await this.listingsRepository.findByIdRaw(dto.listingId);
    if (!listing || listing.deletedAt) {
      throw new ReviewNotFoundException();
    }
    if (listing.sellerId === user.id) {
      throw new CannotReviewOwnListingException();
    }

    const exists = await this.reviewsRepository.reviewExists(user.id, dto.listingId);
    if (exists) {
      throw new DuplicateReviewException();
    }

    const review = await this.reviewsRepository.createReview({
      listingId: dto.listingId,
      reviewerId: user.id,
      sellerId: listing.sellerId,
      rating: dto.rating,
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.body !== undefined ? { body: dto.body } : {}),
      ...(dto.images !== undefined ? { images: dto.images } : {}),
    });

    return serializeReview(review);
  }

  async findByListing(listingId: string, query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.reviewsRepository.findByListing(listingId, { page, limit });
    return toPaginatedResponse({
      ...result,
      items: result.items.map(serializeReview),
    });
  }

  async findBySeller(sellerId: string, query: { page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.reviewsRepository.findBySeller(sellerId, { page, limit });
    return toPaginatedResponse({
      ...result,
      items: result.items.map(serializeReview),
    });
  }

  async getListingSummary(listingId: string) {
    const { ratings, distribution } = await this.reviewsRepository.getListingRatingSummary(listingId);
    return buildReviewSummary(ratings, distribution);
  }

  async getSellerSummary(sellerId: string) {
    const { ratings, distribution } = await this.reviewsRepository.getSellerRatingSummary(sellerId);
    return buildReviewSummary(ratings, distribution);
  }

  async softDelete(id: string, user: AuthenticatedUser) {
    const review = await this.reviewsRepository.findById(id);
    if (!review || review.deletedAt) {
      throw new ReviewNotFoundException();
    }
    if (review.reviewerId !== user.id) {
      throw new ReviewForbiddenException();
    }
    await this.reviewsRepository.softDelete(id);
    return { deleted: true };
  }
}
