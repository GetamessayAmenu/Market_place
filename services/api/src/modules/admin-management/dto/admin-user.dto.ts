import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAdminUserDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName!: string;

  @IsString()
  @IsNotEmpty()
  roleSlug!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalRoleSlugs?: string[];

  @IsOptional()
  @IsBoolean()
  enforceMfa?: boolean;
}

export class UpdateAdminRoleDto {
  @IsString()
  @IsNotEmpty()
  roleSlug!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalRoleSlugs?: string[];

  @IsOptional()
  @IsString()
  stepUpToken?: string;
}

export class SuspendAdminDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  stepUpToken?: string;
}

export class ResetMfaDto {
  @IsOptional()
  @IsString()
  stepUpToken?: string;
}

export class AdminQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
