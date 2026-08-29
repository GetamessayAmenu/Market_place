import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class DisputeQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  take?: number;

  @IsOptional()
  @IsEnum(['open', 'in_progress', 'awaiting_response', 'under_review', 'waiting_for_info', 'waiting_for_information', 'resolved', 'closed', 'escalated'] as const)
  status?: 'open' | 'in_progress' | 'awaiting_response' | 'under_review' | 'waiting_for_info' | 'waiting_for_information' | 'resolved' | 'closed' | 'escalated';

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'] as const)
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @IsEnum(['off_platform_transaction', 'payment_dispute', 'delivery_issue', 'quality_mismatch', 'communication_conflict', 'other'] as const)
  type?: 'off_platform_transaction' | 'payment_dispute' | 'delivery_issue' | 'quality_mismatch' | 'communication_conflict' | 'other';

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  assignedAdminId?: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @IsOptional()
  @IsUUID()
  reportedUserId?: string;

  @IsOptional()
  @IsUUID()
  listingId?: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  rentalId?: string;

  @IsOptional()
  @IsUUID()
  customOrderId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
