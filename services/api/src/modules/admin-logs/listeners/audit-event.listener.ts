import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AuditAction, AuditResourceType } from '../audit-action.enum';
import { AdminLogsService } from '../admin-logs.service';

@Injectable()
export class AuditEventListener {
  constructor(private readonly adminLogsService: AdminLogsService) {}

  @OnEvent('auth.login_success', { async: true })
  async handleLoginSuccess(payload: { userId: string; ipAddress?: string; userAgent?: string }) {
    await this.adminLogsService.createLog({
      actorId: payload.userId,
      actorType: 'USER',
      action: AuditAction.ADMIN_LOGIN_SUCCESS,
      resource: AuditResourceType.USER,
      resourceId: payload.userId,
      description: 'User successfully logged in',
      ipAddress: payload.ipAddress ?? null,
      userAgent: payload.userAgent ?? null,
    });
  }

  @OnEvent('auth.login_failed', { async: true })
  async handleLoginFailed(payload: { email: string; reason?: string; ipAddress?: string; userAgent?: string; systemActorId: string }) {
    await this.adminLogsService.createLog({
      actorId: payload.systemActorId,
      actorType: 'SYSTEM',
      action: AuditAction.ADMIN_LOGIN_FAILED,
      resource: AuditResourceType.USER,
      description: `Failed login attempt for email: ${payload.email}. Reason: ${payload.reason || 'Invalid credentials'}`,
      metadata: { email: payload.email, reason: payload.reason },
      ipAddress: payload.ipAddress ?? null,
      userAgent: payload.userAgent ?? null,
      status: 'FAILURE',
    });
  }

  @OnEvent('listing.created', { async: true })
  async handleListingCreated(payload: { listingId: string; sellerId: string; title?: string }) {
    await this.adminLogsService.createLog({
      actorId: payload.sellerId,
      actorType: 'USER',
      action: AuditAction.LISTING_CREATED,
      resource: AuditResourceType.LISTING,
      resourceId: payload.listingId,
      description: `Listing created: ${payload.title ?? payload.listingId}`,
      metadata: { listingId: payload.listingId, title: payload.title },
    });
  }

  @OnEvent('listing.approved', { async: true })
  async handleListingApproved(payload: { listingId: string; adminId: string; previousStatus?: string }) {
    await this.adminLogsService.createLog({
      actorId: payload.adminId,
      actorType: 'ADMIN',
      action: AuditAction.LISTING_APPROVED,
      resource: AuditResourceType.LISTING,
      resourceId: payload.listingId,
      description: `Listing ${payload.listingId} approved by admin`,
      changes: {
        status: { before: payload.previousStatus ?? 'PENDING_REVIEW', after: 'APPROVED' },
      },
    });
  }

  @OnEvent('listing.rejected', { async: true })
  async handleListingRejected(payload: { listingId: string; adminId: string; reason: string; previousStatus?: string }) {
    await this.adminLogsService.createLog({
      actorId: payload.adminId,
      actorType: 'ADMIN',
      action: AuditAction.LISTING_REJECTED,
      resource: AuditResourceType.LISTING,
      resourceId: payload.listingId,
      description: `Listing ${payload.listingId} rejected. Reason: ${payload.reason}`,
      changes: {
        status: { before: payload.previousStatus ?? 'PENDING_REVIEW', after: 'REJECTED' },
      },
      metadata: { reason: payload.reason },
    });
  }

  @OnEvent('user.suspended', { async: true })
  async handleUserSuspended(payload: { userId: string; adminId: string; reason: string }) {
    await this.adminLogsService.createLog({
      actorId: payload.adminId,
      actorType: 'ADMIN',
      action: AuditAction.USER_SUSPENDED,
      resource: AuditResourceType.USER,
      resourceId: payload.userId,
      description: `User ${payload.userId} suspended. Reason: ${payload.reason}`,
      changes: {
        status: { before: 'ACTIVE', after: 'SUSPENDED' },
      },
      metadata: { reason: payload.reason },
    });
  }

  @OnEvent('user.reactivated', { async: true })
  async handleUserReactivated(payload: { userId: string; adminId: string }) {
    await this.adminLogsService.createLog({
      actorId: payload.adminId,
      actorType: 'ADMIN',
      action: AuditAction.USER_REACTIVATED,
      resource: AuditResourceType.USER,
      resourceId: payload.userId,
      description: `User ${payload.userId} reactivated by admin`,
      changes: {
        status: { before: 'SUSPENDED', after: 'ACTIVE' },
      },
    });
  }

  @OnEvent('report.resolved', { async: true })
  async handleReportResolved(payload: { reportId: string; adminId: string; resolutionAction?: string; note?: string }) {
    await this.adminLogsService.createLog({
      actorId: payload.adminId,
      actorType: 'ADMIN',
      action: AuditAction.REPORT_RESOLVED,
      resource: AuditResourceType.REPORT,
      resourceId: payload.reportId,
      description: `Report ${payload.reportId} resolved with action: ${payload.resolutionAction ?? 'RESOLVED'}`,
      metadata: { resolutionAction: payload.resolutionAction, note: payload.note },
    });
  }

  @OnEvent('chat.message_removed', { async: true })
  async handleMessageRemoved(payload: { messageId: string; adminId: string; conversationId?: string; reason?: string }) {
    await this.adminLogsService.createLog({
      actorId: payload.adminId,
      actorType: 'ADMIN',
      action: AuditAction.MESSAGE_REMOVED,
      resource: AuditResourceType.CHAT,
      resourceId: payload.messageId,
      description: `Chat message removed by admin in conversation ${payload.conversationId ?? ''}`,
      metadata: { conversationId: payload.conversationId, reason: payload.reason },
    });
  }

  @OnEvent('order.status_changed', { async: true })
  async handleOrderStatusChanged(payload: { orderId: string; actorId: string; beforeStatus: string; afterStatus: string; reason?: string }) {
    await this.adminLogsService.createLog({
      actorId: payload.actorId,
      action: AuditAction.ORDER_STATUS_CHANGED,
      resource: AuditResourceType.ORDER,
      resourceId: payload.orderId,
      description: `Order ${payload.orderId} status changed from ${payload.beforeStatus} to ${payload.afterStatus}`,
      changes: {
        status: { before: payload.beforeStatus, after: payload.afterStatus },
      },
      metadata: { reason: payload.reason },
    });
  }

  @OnEvent('rental.status_changed', { async: true })
  async handleRentalStatusChanged(payload: { rentalId: string; actorId: string; beforeStatus: string; afterStatus: string }) {
    await this.adminLogsService.createLog({
      actorId: payload.actorId,
      action: AuditAction.RENTAL_STATUS_CHANGED,
      resource: AuditResourceType.RENTAL,
      resourceId: payload.rentalId,
      description: `Rental order ${payload.rentalId} status changed from ${payload.beforeStatus} to ${payload.afterStatus}`,
      changes: {
        status: { before: payload.beforeStatus, after: payload.afterStatus },
      },
    });
  }

  @OnEvent('custom_order.status_changed', { async: true })
  async handleCustomOrderStatusChanged(payload: { customOrderId: string; actorId: string; beforeStatus: string; afterStatus: string }) {
    await this.adminLogsService.createLog({
      actorId: payload.actorId,
      action: AuditAction.CUSTOM_ORDER_STATUS_CHANGED,
      resource: AuditResourceType.CUSTOM_ORDER,
      resourceId: payload.customOrderId,
      description: `Custom order ${payload.customOrderId} status changed from ${payload.beforeStatus} to ${payload.afterStatus}`,
      changes: {
        status: { before: payload.beforeStatus, after: payload.afterStatus },
      },
    });
  }
}
