import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEnum(['active', 'suspended', 'banned'] as const)
  status?: 'active' | 'suspended' | 'banned';

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
