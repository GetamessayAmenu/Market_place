import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class DisputeQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(['open', 'in_progress', 'awaiting_response', 'under_review', 'resolved', 'closed', 'escalated'] as const)
  status?: 'open' | 'in_progress' | 'awaiting_response' | 'under_review' | 'resolved' | 'closed' | 'escalated';

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'] as const)
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @IsEnum(['off_platform_transaction', 'payment_dispute', 'delivery_issue', 'quality_mismatch', 'communication_conflict', 'other'] as const)
  type?: 'off_platform_transaction' | 'payment_dispute' | 'delivery_issue' | 'quality_mismatch' | 'communication_conflict' | 'other';

  @IsOptional()
  @IsString()
  reporterId?: string;

  @IsOptional()
  @IsString()
  reportedUserId?: string;

  @IsOptional()
  @IsString()
  listingId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
