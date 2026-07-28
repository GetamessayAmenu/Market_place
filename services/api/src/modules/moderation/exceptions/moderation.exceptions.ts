import { BadRequestException, NotFoundException } from '@nestjs/common';

export class ModerationItemNotFoundException extends NotFoundException {
  constructor() {
    super('Moderation item not found');
  }
}

export class InvalidModerationActionException extends BadRequestException {
  constructor(message = 'Invalid moderation action') {
    super(message);
  }
}
