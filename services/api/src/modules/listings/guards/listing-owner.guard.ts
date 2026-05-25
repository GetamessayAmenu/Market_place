import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

import type { RequestWithUser } from '../../../common/interfaces/request-with-user.interface';
import { ListingForbiddenException } from '../exceptions/listing.exceptions';
import { canManageListing } from '../policies/listing.policies';
import { ListingsRepository } from '../listings.repository';

@Injectable()
export class ListingOwnerGuard implements CanActivate {
  constructor(private readonly listingsRepository: ListingsRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    const listingId = request.params['id'] as string | undefined;

    if (!user || !listingId) {
      throw new ListingForbiddenException();
    }

    const listing = await this.listingsRepository.findByIdRaw(listingId);
    if (!listing || listing.deletedAt) {
      throw new ListingForbiddenException();
    }

    if (!canManageListing(user, listing.sellerId)) {
      throw new ListingForbiddenException();
    }

    return true;
  }
}
