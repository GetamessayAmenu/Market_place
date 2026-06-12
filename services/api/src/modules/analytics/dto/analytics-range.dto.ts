import { IsOptional, IsString } from 'class-validator';

export class AnalyticsRangeDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}
