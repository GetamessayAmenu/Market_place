import { MAX_LISTING_IMAGES } from '@marketplace/config';
import { LISTING_CONDITIONS } from '@marketplace/types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { ContactOptionsDto } from './contact-options.dto';
import { ListingImageInputDto } from './listing-image-input.dto';

export class CreateListingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(10_000)
  description!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999.99)
  price!: number;

  @IsUUID()
  categoryId!: string;

  @IsIn([...LISTING_CONDITIONS])
  condition!: (typeof LISTING_CONDITIONS)[number];

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
  @ValidateNested()
  @Type(() => ContactOptionsDto)
  contactOptions?: ContactOptionsDto;

  @IsOptional()
  @IsBoolean()
  availableForPurchase?: boolean;

  @IsOptional()
  @IsBoolean()
  availableForRent?: boolean;

  @IsOptional()
  @IsBoolean()
  customOrderAvailable?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999.99)
  rentalPricePerDay?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999.99)
  rentalDeposit?: number;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_LISTING_IMAGES)
  @ValidateNested({ each: true })
  @Type(() => ListingImageInputDto)
  images!: ListingImageInputDto[];
}
