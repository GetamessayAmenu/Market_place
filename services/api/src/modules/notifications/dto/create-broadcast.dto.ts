import { BroadcastAudience } from '@prisma/client';
import { IsEnum, IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBroadcastDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(5)
  message!: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  actionLabel?: string;

  @IsOptional()
  @IsEnum(BroadcastAudience)
  audience?: BroadcastAudience = BroadcastAudience.ALL_USERS;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;
}
