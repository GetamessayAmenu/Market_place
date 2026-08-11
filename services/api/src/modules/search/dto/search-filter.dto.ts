import { LISTING_CONDITIONS } from '@marketplace/types';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class SearchFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  categorySlug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsIn([...LISTING_CONDITIONS])
  condition?: (typeof LISTING_CONDITIONS)[number];

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999.99)
  maxPrice?: number;

  // Transaction Model Filters
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  supportsReadyMade?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  availableForRent?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  supportsCustomDesign?: boolean;

  // Rental Date Range Filter
  @IsOptional()
  @IsDateString()
  rentalStartDate?: string;

  @IsOptional()
  @IsDateString()
  rentalEndDate?: string;

  // Geographic Hub Filter
  @IsOptional()
  @IsUUID()
  regionalHubId?: string;

  @IsOptional()
  @IsString()
  hubType?: string;

  // Cultural Facet Filters
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  weavingPatterns?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fabricTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  embroideryStyles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  occasionTypes?: string[];

  // Verified Designer Filter (separate from general verified)
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  verifiedDesignerOnly?: boolean;
}
