import { IsEnum, IsOptional, IsString, MaxLength, IsBoolean, IsArray } from 'class-validator';
import { MODERATION_STATUS_VALUES } from '@marketplace/types';

export class ModerationActionDto {
  @IsEnum(MODERATION_STATUS_VALUES)
  action!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class BulkModerationActionDto {
  @IsArray()
  @IsString({ each: true })
  itemIds!: string[];

  @IsEnum(MODERATION_STATUS_VALUES)
  action!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class SpamFlagDto {
  @IsBoolean()
  isSpam!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ReviewModerationDto {
  @IsEnum(MODERATION_STATUS_VALUES)
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsBoolean()
  isSpam?: boolean;}
