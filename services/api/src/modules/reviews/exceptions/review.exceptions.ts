import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

export class ReviewNotFoundException extends NotFoundException {
  constructor() {
    super({ code: 'REVIEW_NOT_FOUND', message: 'Review not found' });
  }
}

export class ReviewForbiddenException extends ForbiddenException {
  constructor(message = 'You do not have permission to modify this review') {
    super({ code: 'REVIEW_FORBIDDEN', message });
  }
}

export class DuplicateReviewException extends BadRequestException {
  constructor() {
    super({
      code: 'DUPLICATE_REVIEW',
      message: 'You have already reviewed this listing',
    });
  }
}

export class CannotReviewOwnListingException extends BadRequestException {
  constructor() {
    super({
      code: 'CANNOT_REVIEW_OWN_LISTING',
      message: 'You cannot review your own listing',
    });
  }
}
