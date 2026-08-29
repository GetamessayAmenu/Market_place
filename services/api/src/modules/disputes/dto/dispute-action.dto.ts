import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class TakeDisputeActionDto {
  @IsString()
  action!: 'warn_user' | 'restrict_user' | 'suspend_user' | 'remove_listing' | string;

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsString()
  listingId?: string;

  @IsString()
  @MaxLength(1000)
  reason!: string;

  @IsOptional()
  @IsNumber()
  durationDays?: number;
}
