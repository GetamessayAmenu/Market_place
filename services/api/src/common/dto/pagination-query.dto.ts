import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@marketplace/config';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { SortOrder } from '@marketplace/types';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number = DEFAULT_PAGE_SIZE;

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: SortOrder = 'desc';
}
