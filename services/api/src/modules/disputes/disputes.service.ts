import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { DisputesRepository } from './disputes.repository';
import type { CreateDisputeCommentDto } from './dto/create-dispute-comment.dto';
import type { CreateDisputeDto } from './dto/create-dispute.dto';
import type { EscalateDisputeDto, ResolveDisputeDto } from './dto/resolve-dispute.dto';
import type { UpdateDisputeDto } from './dto/update-dispute.dto';

@Injectable()
export class DisputesService {
  constructor(
    private readonly repository: DisputesRepository,
    private readonly adminLogsService: AdminLogsService,
  ) {}

  async findAll(query: any) {
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    const dispute = await this.repository.findOne(id);
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    return dispute;
  }

  async findByTicketNumber(ticketNumber: string) {
    const dispute = await this.repository.findByTicketNumber(ticketNumber);
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    return dispute;
  }

  async create(user: AuthenticatedUser, dto: CreateDisputeDto) {
    const dispute = await this.repository.create({
      ...dto,
      reporterId: user.id,
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'create_dispute',
      resource: 'dispute',
      resourceId: dispute.id,
      metadata: { ticketNumber: dispute.ticketNumber, type: dispute.type },
    });

    return dispute;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateDisputeDto) {
    await this.findOne(id);
    
    const updated = await this.repository.update(id, {
      ...dto,
      lastActivityAt: new Date(),
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'update_dispute',
      resource: 'dispute',
      resourceId: id,
      metadata: { changes: dto },
    });

    return updated;
  }

  async updateStatus(user: AuthenticatedUser, id: string, status: string) {
    const dispute = await this.findOne(id);
    
    const updated = await this.repository.update(id, {
      status: status as any,
      lastActivityAt: new Date(),
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'update_dispute_status',
      resource: 'dispute',
      resourceId: id,
      metadata: { previousStatus: dispute.status, newStatus: status },
    });

    return updated;
  }

  async resolve(user: AuthenticatedUser, id: string, dto: ResolveDisputeDto) {
    const dispute = await this.findOne(id);
    
    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      throw new NotFoundException('Dispute is already resolved or closed');
    }

    const resolved = await this.repository.resolve(id, {
      status: 'resolved',
      resolutionNote: dto.resolutionNote,
      resolutionAction: dto.resolutionAction,
      resolvedById: user.id,
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'resolve_dispute',
      resource: 'dispute',
      resourceId: id,
      metadata: { resolutionAction: dto.resolutionAction },
    });

    return resolved;
  }

  async escalate(user: AuthenticatedUser, id: string, dto: EscalateDisputeDto) {
    const dispute = await this.findOne(id);
    
    if (dispute.status === 'escalated') {
      throw new NotFoundException('Dispute is already escalated');
    }

    const escalated = await this.repository.escalate(id, {
      status: 'escalated',
      escalatedById: user.id,
      ...(dto.reason ? { reason: dto.reason } : {}),
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'escalate_dispute',
      resource: 'dispute',
      resourceId: id,
      metadata: { reason: dto.reason },
    });

    return escalated;
  }

  async close(user: AuthenticatedUser, id: string) {
    await this.findOne(id);
    
    const closed = await this.repository.close(id, user.id);

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'close_dispute',
      resource: 'dispute',
      resourceId: id,
    });

    return closed;
  }

  async addComment(user: AuthenticatedUser, disputeId: string, dto: CreateDisputeCommentDto) {
    await this.findOne(disputeId);
    
    const comment = await this.repository.createComment({
      disputeId,
      authorId: user.id,
      content: dto.content,
      isInternal: dto.isInternal || false,
    });

    await this.repository.update(disputeId, { lastActivityAt: new Date() });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'add_dispute_comment',
      resource: 'dispute',
      resourceId: disputeId,
      metadata: { isInternal: dto.isInternal },
    });

    return comment;
  }

  async getComments(disputeId: string, includeInternal = false) {
    await this.findOne(disputeId);
    return this.repository.getComments(disputeId, includeInternal);
  }

  async getStatusCounts() {
    return this.repository.getStatusCounts();
  }
}
