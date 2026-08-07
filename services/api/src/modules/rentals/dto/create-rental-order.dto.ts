import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum RentalPricingTier {
  DAILY = 'DAILY',
  THREE_DAY_EVENT = 'THREE_DAY_EVENT',
  WEEKLY = 'WEEKLY',
  CUSTOM = 'CUSTOM',
}

export class CreateRentalOrderDto {
  @IsString()
  @MaxLength(20)
  listingId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsEnum(RentalPricingTier)
  pricingTier?: RentalPricingTier;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  handoverLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pickupHub?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  preHandoverCondition?: string;

  @IsOptional()
  preHandoverPhotos?: string[];
}
