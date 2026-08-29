import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { toPaginatedResponse } from '../../common/utils/pagination.util';
import { QUEUE_NAMES } from '../../infrastructure/queue/queue.constants';
import { BroadcastsRepository } from './broadcasts.repository';
import { BroadcastQueueProcessor } from './processors/broadcast-queue.processor';
import type { CreateBroadcastDto } from './dto/create-broadcast.dto';
import type { UpdateBroadcastDto } from './dto/update-broadcast.dto';
import type { BroadcastQueryDto } from './dto/broadcast-query.dto';

@Injectable()
export class BroadcastsService {
  private readonly logger = new Logger(BroadcastsService.name);

  constructor(
    private readonly broadcastsRepository: BroadcastsRepository,
    private readonly broadcastQueueProcessor: BroadcastQueueProcessor,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS)
    private readonly notificationsQueue: Queue,
  ) {}

  async createBroadcast(user: AuthenticatedUser, dto: CreateBroadcastDto) {
    const isScheduled = Boolean(dto.scheduledAt);
    const scheduledDate = dto.scheduledAt ? new Date(dto.scheduledAt) : null;

    if (scheduledDate && scheduledDate.getTime() < Date.now()) {
      throw new BadRequestException('Scheduled date must be in the future.');
    }

    const broadcast = await this.broadcastsRepository.createBroadcast({
      createdBy: { connect: { id: user.id } },
      title: dto.title,
      message: dto.message,
      imageUrl: dto.imageUrl ?? null,
      actionUrl: dto.actionUrl ?? null,
      actionLabel: dto.actionLabel ?? null,
      audience: dto.audience ?? 'ALL_USERS',
      scheduledAt: scheduledDate,
      status: isScheduled ? 'SCHEDULED' : 'DRAFT',
    });

    return broadcast;
  }

  async updateBroadcast(_user: AuthenticatedUser, id: string, dto: UpdateBroadcastDto) {
    const broadcast = await this.broadcastsRepository.findBroadcastById(id);
    if (!broadcast) {
      throw new NotFoundException('Broadcast not found.');
    }

    if (broadcast.status !== 'DRAFT' && broadcast.status !== 'SCHEDULED') {
      throw new BadRequestException(`Cannot update broadcast in ${broadcast.status} state.`);
    }

    const scheduledDate = dto.scheduledAt ? new Date(dto.scheduledAt) : broadcast.scheduledAt;

    const updated = await this.broadcastsRepository.updateBroadcast(id, {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.message !== undefined ? { message: dto.message } : {}),
      ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
      ...(dto.actionUrl !== undefined ? { actionUrl: dto.actionUrl } : {}),
      ...(dto.actionLabel !== undefined ? { actionLabel: dto.actionLabel } : {}),
      ...(dto.audience !== undefined ? { audience: dto.audience } : {}),
      ...(dto.scheduledAt !== undefined ? { scheduledAt: scheduledDate } : {}),
    });

    return updated;
  }

  async deleteDraft(_user: AuthenticatedUser, id: string) {
    const broadcast = await this.broadcastsRepository.findBroadcastById(id);
    if (!broadcast) {
      throw new NotFoundException('Broadcast not found.');
    }

    if (broadcast.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT broadcasts can be deleted.');
    }

    await this.broadcastsRepository.deleteBroadcast(id);
    return { success: true, message: 'Broadcast draft deleted successfully.' };
  }

  async sendNow(_user: AuthenticatedUser, id: string) {
    const broadcast = await this.broadcastsRepository.findBroadcastById(id);
    if (!broadcast) {
      throw new NotFoundException('Broadcast not found.');
    }

    if (broadcast.status === 'SENT') {
      throw new BadRequestException('Broadcast has already been sent.');
    }

    await this.broadcastsRepository.updateBroadcast(id, {
      status: 'PROCESSING',
    });

    // Try adding to BullMQ queue
    try {
      await this.notificationsQueue.add(
        'process_broadcast',
        { broadcastId: id },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
        },
      );
    } catch (queueErr) {
      this.logger.warn(`BullMQ queue add failed: ${(queueErr as Error).message}. Running direct execution fallback.`);
    }

    // Trigger delivery execution immediately in background
    void this.broadcastQueueProcessor.executeBroadcastDelivery(id).catch((err) => {
      this.logger.error(`Direct broadcast delivery failed for ${id}: ${(err as Error).message}`);
    });

    return { success: true, message: 'Broadcast delivery initiated.' };
  }

  async cancelScheduled(_user: AuthenticatedUser, id: string) {
    const broadcast = await this.broadcastsRepository.findBroadcastById(id);
    if (!broadcast) {
      throw new NotFoundException('Broadcast not found.');
    }

    if (broadcast.status !== 'SCHEDULED') {
      throw new BadRequestException('Only SCHEDULED broadcasts can be cancelled.');
    }

    const cancelled = await this.broadcastsRepository.updateBroadcast(id, {
      status: 'CANCELLED',
    });

    return cancelled;
  }

  async findAll(query: BroadcastQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const result = await this.broadcastsRepository.findBroadcasts({
      page,
      limit,
      status: query.status ?? undefined,
      audience: query.audience ?? undefined,
      search: query.search ?? undefined,
    });

    return toPaginatedResponse({
      ...result,
      page,
      limit,
    });
  }

  async getById(id: string) {
    const broadcast = await this.broadcastsRepository.findBroadcastById(id);
    if (!broadcast) {
      throw new NotFoundException('Broadcast not found.');
    }
    return broadcast;
  }

  async getStats() {
    return this.broadcastsRepository.getBroadcastStats();
  }
}
