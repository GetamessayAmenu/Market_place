import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBlackoutDateDto {
  @IsString()
  listingId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
