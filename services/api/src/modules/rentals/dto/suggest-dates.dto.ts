import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class SuggestDatesDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
