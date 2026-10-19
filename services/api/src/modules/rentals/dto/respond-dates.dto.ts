import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class RespondDatesDto {
  @IsBoolean()
  accept!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
