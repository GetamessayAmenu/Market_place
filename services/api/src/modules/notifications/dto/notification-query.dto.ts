import type { NotificationType } from '@prisma/client';

import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class NotificationQueryDto extends PaginationQueryDto {
  @IsOptional()
  type?: NotificationType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unreadOnly?: boolean;
}
