import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { MODERATION_STATUS_VALUES, MODERATION_ITEM_TYPE_VALUES } from '@marketplace/types';

export class ModerationQueryDto {
  @IsOptional()
  @IsEnum(MODERATION_ITEM_TYPE_VALUES)
  itemType?: string;

  @IsOptional()
  @IsEnum(MODERATION_STATUS_VALUES)
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rating?: number;

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'rating' | 'reportCount' | 'spamScore';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['true', 'false'])
  isSpam?: string;
}
