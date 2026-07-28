import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CONTENT_STATUSES, CONTENT_TYPES } from '@marketplace/types';

export class HomepageContentQueryDto {
  @IsOptional()
  @IsEnum(CONTENT_TYPES)
  type?: string;

  @IsOptional()
  @IsEnum(CONTENT_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
