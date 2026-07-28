import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRentalOrderDto {
  @IsString()
  @MaxLength(20)
  listingId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  handoverLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  preHandoverCondition?: string;

  @IsOptional()
  preHandoverPhotos?: string[];
}
