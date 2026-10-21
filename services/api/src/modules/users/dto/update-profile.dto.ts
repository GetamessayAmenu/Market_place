import { IsOptional, IsString, MaxLength, IsEnum, IsObject } from 'class-validator';
import { SellerType } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  readonly phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  readonly bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly location?: string;

  @IsOptional()
  @IsEnum(SellerType)
  readonly sellerType?: SellerType;

  @IsOptional()
  @IsObject()
  readonly socialLinks?: Record<string, any>;
}

