import { IsNumber, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateQuoteDto {
  @IsNumber()
  @Min(0)
  proposedPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  proposedDeposit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedLeadTimeDays?: number;

  @IsOptional()
  @IsString()
  customizationNotes?: string;

  @IsOptional()
  @IsString()
  fabricType?: string;

  @IsOptional()
  @IsString()
  embroideryPattern?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
