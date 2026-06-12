import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { ReportStatus, ReportTargetType } from '@prisma/client';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ReportQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(['listing', 'user', 'message', 'conversation'] as const)
  targetType?: ReportTargetType;

  @IsOptional()
  @IsEnum(['pending', 'under_review', 'resolved', 'dismissed'] as const)
  status?: ReportStatus;

  @IsOptional()
  @IsString()
  reporterId?: string;

  @IsOptional()
  @IsString()
  reportedUserId?: string;

  @IsOptional()
  @IsString()
  listingId?: string;
}
