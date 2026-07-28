import { IsEnum, IsOptional, IsString, IsUrl, IsInt, IsDateString, MaxLength, Min } from 'class-validator';
import { CONTENT_STATUSES, CONTENT_TYPES } from '@marketplace/types';

export class CreateHomepageContentDto {
  @IsEnum(CONTENT_TYPES)
  type!: string;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  cloudinaryPublicId?: string;

  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  linkLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  buttonText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  textColor?: string;

  @IsEnum(CONTENT_STATUSES)
  status!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @IsOptional()
  @IsDateString()
  unpublishAt?: string;

  @IsOptional()
  @IsString()
  featuredListingId?: string;

  @IsOptional()
  @IsString()
  featuredCategoryId?: string;
}
