import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelRentalDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
