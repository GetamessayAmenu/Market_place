import { LISTING_CONDITIONS } from '@marketplace/types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
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

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_LISTING_IMAGES)
  @ValidateNested({ each: true })
  @Type(() => ListingImageInputDto)
  images!: ListingImageInputDto[];
}
