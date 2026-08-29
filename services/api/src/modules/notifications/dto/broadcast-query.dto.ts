import { BroadcastAudience, BroadcastStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class BroadcastQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(BroadcastStatus)
  status?: BroadcastStatus;

  @IsOptional()
  @IsEnum(BroadcastAudience)
  audience?: BroadcastAudience;

  @IsOptional()
  @IsString()
  search?: string;
}
