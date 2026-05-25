import { ForbiddenException, NotFoundException } from '@nestjs/common';

export class ListingNotFoundException extends NotFoundException {
  constructor() {
    super({ code: 'LISTING_NOT_FOUND', message: 'Listing not found' });
  }
}

export class ListingForbiddenException extends ForbiddenException {
  constructor(message = 'You do not have permission to modify this listing') {
    super({ code: 'LISTING_FORBIDDEN', message });
  }
}

export class CategoryNotFoundException extends NotFoundException {
  constructor() {
    super({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
  }
}

export class InvalidListingStatusTransitionException extends ForbiddenException {
  constructor(from: string, to: string) {
    super({
      code: 'INVALID_LISTING_STATUS',
      message: `Cannot transition listing from ${from} to ${to}`,
    });
  }
}
