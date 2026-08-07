import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderType } from './dto/order-type.enum';
import { OrderStatus } from './dto/update-order-status.dto';

export interface StateTransition {
  from: OrderStatus;
  to: OrderStatus;
  condition?: (order: any) => boolean;
}

@Injectable()
export class OrderStateMachineService {
  private readonly transitions: Map<OrderType, StateTransition[]> = new Map();

  constructor() {
    this.initializeTransitions();
  }

  private initializeTransitions() {
    // Common transitions for all order types
    const commonTransitions: StateTransition[] = [
      { from: OrderStatus.INQUIRY_PENDING, to: OrderStatus.QUOTE_PROPOSED },
      { from: OrderStatus.QUOTE_PROPOSED, to: OrderStatus.APPROVED_RESERVED },
      { from: OrderStatus.APPROVED_RESERVED, to: OrderStatus.READY_FOR_HANDOVER },
      { from: OrderStatus.READY_FOR_HANDOVER, to: OrderStatus.COMPLETED },
      { from: OrderStatus.INQUIRY_PENDING, to: OrderStatus.CANCELLED },
      { from: OrderStatus.QUOTE_PROPOSED, to: OrderStatus.CANCELLED },
      { from: OrderStatus.APPROVED_RESERVED, to: OrderStatus.CANCELLED },
      { from: OrderStatus.READY_FOR_HANDOVER, to: OrderStatus.DISPUTED },
      { from: OrderStatus.COMPLETED, to: OrderStatus.DISPUTED },
    ];

    // Custom Tailoring specific transitions
    const customTailoringTransitions: StateTransition[] = [
      ...commonTransitions,
      { from: OrderStatus.APPROVED_RESERVED, to: OrderStatus.MEASUREMENTS_SUBMITTED },
      { from: OrderStatus.MEASUREMENTS_SUBMITTED, to: OrderStatus.FABRIC_CUTTING },
      { from: OrderStatus.FABRIC_CUTTING, to: OrderStatus.TAILORING_IN_PROGRESS },
      { from: OrderStatus.TAILORING_IN_PROGRESS, to: OrderStatus.FITTING_READY },
      { from: OrderStatus.FITTING_READY, to: OrderStatus.READY_FOR_HANDOVER },
      { from: OrderStatus.MEASUREMENTS_SUBMITTED, to: OrderStatus.CANCELLED },
      { from: OrderStatus.FABRIC_CUTTING, to: OrderStatus.CANCELLED },
      { from: OrderStatus.TAILORING_IN_PROGRESS, to: OrderStatus.CANCELLED },
      { from: OrderStatus.FITTING_READY, to: OrderStatus.CANCELLED },
    ];

    // Rental specific transitions
    const rentalTransitions: StateTransition[] = [
      ...commonTransitions,
      { from: OrderStatus.APPROVED_RESERVED, to: OrderStatus.HANDOVER_PENDING_DEPOSIT },
      { from: OrderStatus.HANDOVER_PENDING_DEPOSIT, to: OrderStatus.RENTAL_ACTIVE },
      { from: OrderStatus.RENTAL_ACTIVE, to: OrderStatus.RETURN_INITIATED },
      { from: OrderStatus.RETURN_INITIATED, to: OrderStatus.RETURNED_INSPECTED },
      { from: OrderStatus.RETURNED_INSPECTED, to: OrderStatus.COMPLETED },
      { from: OrderStatus.RENTAL_ACTIVE, to: OrderStatus.DISPUTED },
      { from: OrderStatus.RETURN_INITIATED, to: OrderStatus.DISPUTED },
      { from: OrderStatus.RETURNED_INSPECTED, to: OrderStatus.DISPUTED },
      { from: OrderStatus.HANDOVER_PENDING_DEPOSIT, to: OrderStatus.CANCELLED },
      { from: OrderStatus.RENTAL_ACTIVE, to: OrderStatus.CANCELLED },
    ];

    this.transitions.set(OrderType.SALE, commonTransitions);
    this.transitions.set(OrderType.CUSTOM_TAILORING, customTailoringTransitions);
    this.transitions.set(OrderType.RENTAL, rentalTransitions);
  }

  canTransition(orderType: OrderType, currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const typeTransitions = this.transitions.get(orderType);
    if (!typeTransitions) {
      return false;
    }

    return typeTransitions.some(
      transition => transition.from === currentStatus && transition.to === newStatus
    );
  }

  validateTransition(orderType: OrderType, currentStatus: OrderStatus, newStatus: OrderStatus): void {
    if (!this.canTransition(orderType, currentStatus, newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus} for order type ${orderType}`
      );
    }
  }

  getValidNextStates(orderType: OrderType, currentStatus: OrderStatus): OrderStatus[] {
    const typeTransitions = this.transitions.get(orderType);
    if (!typeTransitions) {
      return [];
    }

    return typeTransitions
      .filter(transition => transition.from === currentStatus)
      .map(transition => transition.to);
  }

  isFinalStatus(status: OrderStatus): boolean {
    return [
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
      OrderStatus.DISPUTED,
    ].includes(status);
  }

  canCancel(status: OrderStatus): boolean {
    return [
      OrderStatus.INQUIRY_PENDING,
      OrderStatus.QUOTE_PROPOSED,
      OrderStatus.APPROVED_RESERVED,
      OrderStatus.MEASUREMENTS_SUBMITTED,
      OrderStatus.FABRIC_CUTTING,
      OrderStatus.TAILORING_IN_PROGRESS,
      OrderStatus.FITTING_READY,
      OrderStatus.HANDOVER_PENDING_DEPOSIT,
      OrderStatus.RENTAL_ACTIVE,
    ].includes(status);
  }
}
