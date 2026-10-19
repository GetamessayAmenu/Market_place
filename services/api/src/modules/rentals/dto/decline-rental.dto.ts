import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeclineRentalDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
