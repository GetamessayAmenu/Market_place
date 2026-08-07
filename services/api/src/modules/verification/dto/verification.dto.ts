import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyTokenDto {
  @IsNotEmpty()
  @IsString()
  token!: string;
}

export class AdminVerificationQueryDto {
  @IsOptional()
  @IsEnum(['pending', 'under_review', 'approved', 'rejected', 'changes_requested', 'cancelled'] as const)
  status?: 'pending' | 'under_review' | 'approved' | 'rejected' | 'changes_requested' | 'cancelled';

  @IsOptional()
  @IsEnum(['email', 'phone', 'identity', 'business', 'seller_verification', 'identity_verification', 'business_verification'] as const)
  type?: 'email' | 'phone' | 'identity' | 'business' | 'seller_verification' | 'identity_verification' | 'business_verification';

  @IsOptional()
  @IsString()
  userId?: string;
}

export class ReviewVerificationDto {
  @IsEnum(['approved', 'rejected', 'changes_requested'] as const)
  decision!: 'approved' | 'rejected' | 'changes_requested';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
