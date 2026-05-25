import { LISTING_CONDITIONS, LISTING_STATUSES } from '@marketplace/types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { MAX_LISTING_IMAGES } from '@marketplace/config';

import { ContactOptionsDto } from './contact-options.dto';
import { ListingImageInputDto } from './listing-image-input.dto';

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(10_000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999.99)
  price?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsIn([...LISTING_CONDITIONS])
  condition?: (typeof LISTING_CONDITIONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsIn([...LISTING_STATUSES])
  status?: (typeof LISTING_STATUSES)[number];

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactOptionsDto)
  contactOptions?: ContactOptionsDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_LISTING_IMAGES)
  @ValidateNested({ each: true })
  @Type(() => ListingImageInputDto)
  images?: ListingImageInputDto[];
}
