import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateRentalExtensionDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  additionalDays?: number;

  @IsOptional()
  @IsDateString()
  newEndDate?: string;

  @IsOptional()
  @IsDateString()
  requestedEndDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

