import { MAX_LISTING_IMAGES } from '@marketplace/config';
import { LISTING_CONDITIONS, LISTING_STATUSES } from '@marketplace/types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
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
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

import { ContactOptionsDto } from './contact-options.dto';
import { ListingImageInputDto } from './listing-image-input.dto';

@ValidatorConstraint({ name: 'customDesignValidation', async: false })
export class CustomDesignValidation implements ValidatorConstraintInterface {
  validate(_value: any, args: ValidationArguments) {
    const object = args.object as any;
    if (object.supportsCustomDesign === true) {
      return object.estimatedProductionDays !== undefined && object.estimatedProductionDays > 0;
    }
    return true;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'estimatedProductionDays is required when supportsCustomDesign is true';
  }
}

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
  @IsString()
  @MaxLength(500)
  rejectedReason?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

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
  @IsBoolean()
  supportsReadyMade?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsCustomDesign?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999.99)
  startingCustomPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  estimatedProductionDays?: number;

  @IsOptional()
  @IsObject()
  customizationOptions?: Record<string, unknown>;

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
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  minRentalDurationDays?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  maxRentalDurationDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  rentalPickupLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rentalNotes?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_LISTING_IMAGES)
  @ValidateNested({ each: true })
  @Type(() => ListingImageInputDto)
  images?: ListingImageInputDto[];

  @Validate(CustomDesignValidation)
  classValidatorCustomDesign?: any;
}
