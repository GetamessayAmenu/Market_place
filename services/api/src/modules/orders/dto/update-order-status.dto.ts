import { IsEnum, IsOptional, IsString, IsArray, IsObject, IsNotEmpty } from 'class-validator';

export enum OrderStatus {
  INQUIRY_PENDING = 'INQUIRY_PENDING',
  QUOTE_PROPOSED = 'QUOTE_PROPOSED',
  APPROVED_RESERVED = 'APPROVED_RESERVED',
  READY_FOR_HANDOVER = 'READY_FOR_HANDOVER',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
  MEASUREMENTS_SUBMITTED = 'MEASUREMENTS_SUBMITTED',
  FABRIC_CUTTING = 'FABRIC_CUTTING',
  TAILORING_IN_PROGRESS = 'TAILORING_IN_PROGRESS',
  FITTING_READY = 'FITTING_READY',
  HANDOVER_PENDING_DEPOSIT = 'HANDOVER_PENDING_DEPOSIT',
  RENTAL_ACTIVE = 'RENTAL_ACTIVE',
  RETURN_INITIATED = 'RETURN_INITIATED',
  RETURNED_INSPECTED = 'RETURNED_INSPECTED',
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preHandoverPhotos?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  postReturnPhotos?: string[];

  @IsOptional()
  @IsObject()
  disputeNotes?: any;
}
