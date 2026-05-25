import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

export class ConversationNotFoundException extends NotFoundException {
  constructor() {
    super({ code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found' });
  }
}

export class ConversationForbiddenException extends ForbiddenException {
  constructor(message = 'You are not a participant in this conversation') {
    super({ code: 'CONVERSATION_FORBIDDEN', message });
  }
}

export class ChatNotAllowedException extends ForbiddenException {
  constructor(message: string) {
    super({ code: 'CHAT_NOT_ALLOWED', message });
  }
}

export class InvalidChatPayloadException extends BadRequestException {
  constructor(message: string) {
    super({ code: 'INVALID_CHAT_PAYLOAD', message });
  }
}
