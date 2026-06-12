import type { NotificationType } from '@prisma/client';

import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class NotificationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(['listing_approved', 'listing_rejected', 'new_message', 'new_offer', 'report_update', 'verification_update', 'system'] as const)
  type?: NotificationType;

  @IsOptional()
  @IsString()
  @Type(() => Boolean)
  unreadOnly?: boolean;
}
