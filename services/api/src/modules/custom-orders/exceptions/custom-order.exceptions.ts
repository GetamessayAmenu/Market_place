import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

export class CustomOrderNotFoundException extends NotFoundException {
  constructor() {
    super({ code: 'CUSTOM_ORDER_NOT_FOUND', message: 'Custom order not found' });
  }
}

export class CustomOrderForbiddenException extends ForbiddenException {
  constructor(message = 'You do not have permission to modify this order') {
    super({ code: 'CUSTOM_ORDER_FORBIDDEN', message });
  }
}

export class ListingNotCustomOrderableException extends BadRequestException {
  constructor() {
    super({
      code: 'LISTING_NOT_CUSTOM_ORDERABLE',
      message: 'This listing does not accept custom orders',
    });
  }
}

export class InvalidCustomOrderStatusTransitionException extends BadRequestException {
  constructor(from: string, to: string) {
    super({
      code: 'INVALID_CUSTOM_ORDER_STATUS',
      message: `Cannot transition custom order from ${from} to ${to}`,
    });
  }
}
