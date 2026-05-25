import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { CHAT_DOMAIN_EVENTS } from '../../events.constants';
import type {
  ChatMessageSentEvent,
  ChatSpamSuspectedEvent,
} from '../events/chat.domain-events';

/**
 * Moderation hook layer — wire to BullMQ / admin review in a later phase.
 */
@Injectable()
export class ChatModerationListener {
  private readonly logger = new Logger(ChatModerationListener.name);

  @OnEvent(CHAT_DOMAIN_EVENTS.MESSAGE_SENT)
  onMessageSent(event: ChatMessageSentEvent): void {
    this.logger.debug(
      `moderation:message_sent conversation=${event.conversationId} sender=${event.senderId}`,
    );
  }

  @OnEvent(CHAT_DOMAIN_EVENTS.SPAM_SUSPECTED)
  onSpamSuspected(event: ChatSpamSuspectedEvent): void {
    this.logger.warn(
      `moderation:spam_suspected conversation=${event.conversationId} reason=${event.reason}`,
    );
  }

  @OnEvent(CHAT_DOMAIN_EVENTS.REPORT_READY)
  onReportReady(): void {
    this.logger.debug('moderation:report_ready hook');
  }
}
