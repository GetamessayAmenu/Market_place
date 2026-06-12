import type { UserStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class UserQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['active', 'suspended', 'banned', 'pending_verification'] as const)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  role?: string;
}
