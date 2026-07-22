import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export enum OrderType {
  product = 'product',
  rental = 'rental',
  custom_service = 'custom_service',
}

export enum OrderStatus {
  pending = 'pending',
  confirmed = 'confirmed',
  processing = 'processing',
  shipped = 'shipped',
  delivered = 'delivered',
  cancelled = 'cancelled',
  refunded = 'refunded',
}

export enum PaymentStatus {
  pending = 'pending',
  processing = 'processing',
  paid = 'paid',
  failed = 'failed',
  refunded = 'refunded',
  partial_refund = 'partial_refund',
}

export class OrderQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  buyerId?: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
