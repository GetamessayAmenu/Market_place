import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyTokenDto {
  @IsNotEmpty()
  @IsString()
  token!: string;
}

export class AdminVerificationQueryDto {
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected', 'cancelled'] as const)
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';

  @IsOptional()
  @IsEnum(['email', 'phone', 'identity', 'business'] as const)
  type?: 'email' | 'phone' | 'identity' | 'business';

  @IsOptional()
  @IsString()
  userId?: string;
}

export class ReviewVerificationDto {
  @IsEnum(['approved', 'rejected'] as const)
  decision!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
