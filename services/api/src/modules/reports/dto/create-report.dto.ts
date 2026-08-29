import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsEnum(['listing', 'user', 'message', 'conversation'] as const)
  targetType!: 'listing' | 'user' | 'message' | 'conversation';

  @IsNotEmpty()
  @MaxLength(100)
  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUUID()
  listingId?: string;

  @IsOptional()
  @IsUUID()
  reportedUserId?: string;

  @IsOptional()
  @IsUUID()
  messageId?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'] as const)
  priority?: 'low' | 'medium' | 'high' | 'critical';

  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
