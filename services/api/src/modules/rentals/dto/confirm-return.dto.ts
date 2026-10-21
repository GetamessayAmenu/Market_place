import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ConfirmReturnDto {
  @IsOptional()
  @IsBoolean()
  penaltyPaid?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  penaltyAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  settlementMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  penaltyNotes?: string;
}
