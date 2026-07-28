import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateRentalExtensionDto {
  @IsNumber()
  @Min(1)
  additionalDays!: number;

  @IsDateString()
  newEndDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
