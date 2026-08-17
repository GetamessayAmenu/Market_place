import { Job } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { QUEUE_NAMES } from '../../../infrastructure/queue/queue.constants';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface ChatSafetyJobData {
  type: 'safety_flag' | 'flag_resolved';
  messageId?: string;
  conversationId: string;
  reason?: string;
  keywordTriggered?: string;
  riskScore?: number;
  adminId?: string;
  action?: string;
  actionReason?: string;
}

@Processor(QUEUE_NAMES.CHAT_SAFETY)
export class ChatSafetyQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(ChatSafetyQueueProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.AUDIT_LOG) private readonly auditLogQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<ChatSafetyJobData>): Promise<void> {
    this.logger.log(`Processing chat safety job ${String(job.id)}: ${job.data.type}`);

    try {
      switch (job.data.type) {
        case 'safety_flag':
          await this.handleSafetyFlag(job.data);
          break;
        case 'flag_resolved':
          await this.handleFlagResolved(job.data);
          break;
        default:
          this.logger.warn(`Unknown chat safety job type: ${String(job.data.type)}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process chat safety job: ${(error as Error).message}`);
      throw error;
    }
  }

  private async handleSafetyFlag(data: ChatSafetyJobData): Promise<void> {
    this.logger.log(
      `Safety flag detected: conversation ${data.conversationId}, reason: ${data.reason}, keyword: ${data.keywordTriggered}`,
    );

    // Create admin log entry for audit trail
    await this.prisma.adminLog.create({
      data: {
        actorId: 'SYSTEM',
        action: 'CHAT_SAFETY_FLAG',
        resource: 'conversation',
        resourceId: data.conversationId,
        metadata: {
          reason: data.reason,
          keywordTriggered: data.keywordTriggered,
          riskScore: data.riskScore,
          messageId: data.messageId,
        },
      },
    });

    // Emit real-time alert to admin dashboard via WebSocket
    // This would be handled by the event emitter in the safety service
  }

  private async handleFlagResolved(data: ChatSafetyJobData): Promise<void> {
    this.logger.log(
      `Flag resolved: conversation ${data.conversationId}, action: ${data.action}, by admin: ${data.adminId}`,
    );

    // Create admin log entry for audit trail
    await this.prisma.adminLog.create({
      data: {
        actorId: data.adminId || 'SYSTEM',
        action: 'CHAT_FLAG_RESOLVED',
        resource: 'conversation',
        resourceId: data.conversationId,
        metadata: {
          action: data.action,
          actionReason: data.actionReason,
          originalReason: data.reason,
        },
      },
    });

    // Queue additional audit log if needed
    await this.auditLogQueue.add(
      'chat_audit',
      {
        action: 'CHAT_FLAG_RESOLVED',
        resourceId: data.conversationId,
        actorId: data.adminId,
        metadata: {
          action: data.action,
          reason: data.actionReason,
        },
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }
}
