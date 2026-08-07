import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { NotificationsGateway } from './notifications.gateway';
import { userRoom } from '../events.constants';

/**
 * Listener for order-related events from the API service.
 * Emits Socket.IO events to buyers and sellers for real-time order updates.
 */
@Injectable()
export class OrderEventsListener implements OnModuleInit {
  private readonly logger = new Logger(OrderEventsListener.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  onModuleInit(): void {
    this.setupOrderEventListeners();
  }

  private setupOrderEventListeners(): void {
    // Quote proposed by seller
    this.eventEmitter.on('order.quote_proposed', (event: any) => {
      try {
        this.notificationsGateway.server?.to(userRoom(event.buyerId)).emit('order:quote_proposed', {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          quoteId: event.quoteId,
          proposedPrice: event.proposedPrice,
          proposedDeposit: event.proposedDeposit,
          estimatedLeadTimeDays: event.estimatedLeadTimeDays,
        });
        this.logger.log(`Emitted quote_proposed event for order ${event.orderNumber} to buyer ${event.buyerId}`);
      } catch (error) {
        this.logger.error(`Failed to emit quote_proposed event: ${(error as Error).message}`);
      }
    });

    // Quote accepted by buyer
    this.eventEmitter.on('order.quote_accepted', (event: any) => {
      try {
        this.notificationsGateway.server?.to(userRoom(event.sellerId)).emit('order:quote_accepted', {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          quoteId: event.quoteId,
        });
        this.logger.log(`Emitted quote_accepted event for order ${event.orderNumber} to seller ${event.sellerId}`);
      } catch (error) {
        this.logger.error(`Failed to emit quote_accepted event: ${(error as Error).message}`);
      }
    });

    // Order declined by seller
    this.eventEmitter.on('order.declined', (event: any) => {
      try {
        this.notificationsGateway.server?.to(userRoom(event.buyerId)).emit('order:declined', {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          reason: event.reason,
        });
        this.logger.log(`Emitted declined event for order ${event.orderNumber} to buyer ${event.buyerId}`);
      } catch (error) {
        this.logger.error(`Failed to emit declined event: ${(error as Error).message}`);
      }
    });

    // Alternative dates proposed for rental
    this.eventEmitter.on('order.alternative_dates_proposed', (event: any) => {
      try {
        this.notificationsGateway.server?.to(userRoom(event.buyerId)).emit('order:alternative_dates_proposed', {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          quoteId: event.quoteId,
          alternativeDates: event.alternativeDates,
        });
        this.logger.log(`Emitted alternative_dates_proposed event for order ${event.orderNumber} to buyer ${event.buyerId}`);
      } catch (error) {
        this.logger.error(`Failed to emit alternative_dates_proposed event: ${(error as Error).message}`);
      }
    });

    // Tailoring milestone updated
    this.eventEmitter.on('order.tailoring_milestone_updated', (event: any) => {
      try {
        this.notificationsGateway.server?.to(userRoom(event.buyerId)).emit('order:tailoring_milestone_updated', {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          milestone: event.milestone,
          status: event.status,
        });
        this.logger.log(`Emitted tailoring_milestone_updated event for order ${event.orderNumber} to buyer ${event.buyerId}`);
      } catch (error) {
        this.logger.error(`Failed to emit tailoring_milestone_updated event: ${(error as Error).message}`);
      }
    });

    // Rental extension requested by buyer
    this.eventEmitter.on('order.extension_requested', (event: any) => {
      try {
        this.notificationsGateway.server?.to(userRoom(event.sellerId)).emit('order:extension_requested', {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          extensionDays: event.extensionDays,
          reason: event.reason,
        });
        this.logger.log(`Emitted extension_requested event for order ${event.orderNumber} to seller ${event.sellerId}`);
      } catch (error) {
        this.logger.error(`Failed to emit extension_requested event: ${(error as Error).message}`);
      }
    });

    // Rental extension responded by seller
    this.eventEmitter.on('order.extension_responded', (event: any) => {
      try {
        this.notificationsGateway.server?.to(userRoom(event.buyerId)).emit('order:extension_responded', {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          approved: event.approved,
          extensionDays: event.extensionDays,
          newEndDate: event.newEndDate,
        });
        this.logger.log(`Emitted extension_responded event for order ${event.orderNumber} to buyer ${event.buyerId}`);
      } catch (error) {
        this.logger.error(`Failed to emit extension_responded event: ${(error as Error).message}`);
      }
    });

    // Order status updated (general)
    this.eventEmitter.on('order.status_updated', (event: any) => {
      try {
        // Emit to both buyer and seller
        const room = userRoom(event.buyerId);
        const sellerRoom = userRoom(event.sellerId);
        this.notificationsGateway.server?.to(room).to(sellerRoom).emit('order:status_updated', {
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          status: event.status,
          condition: event.condition,
          deductionAmount: event.deductionAmount,
        });
        this.logger.log(`Emitted status_updated event for order ${event.orderNumber}`);
      } catch (error) {
        this.logger.error(`Failed to emit status_updated event: ${(error as Error).message}`);
      }
    });
  }
}
