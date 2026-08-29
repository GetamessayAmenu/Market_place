import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { ReportPriority, ReportStatus, ReportTargetType } from '@prisma/client';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ReportQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(['listing', 'user', 'message', 'conversation'] as const)
  targetType?: ReportTargetType;

  @IsOptional()
  @IsEnum(['pending', 'under_review', 'investigating', 'resolved', 'dismissed', 'closed'] as const)
  status?: ReportStatus;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'] as const)
  priority?: ReportPriority;

  @IsOptional()
  @IsString()
  assignedAdminId?: string;

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
  conversationId?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
