import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsEnum(['listing', 'user', 'message', 'conversation', 'order', 'rental', 'custom_order', 'other'] as const)
  targetType!: 'listing' | 'user' | 'message' | 'conversation' | 'order' | 'rental' | 'custom_order' | 'other';

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
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  rentalId?: string;

  @IsOptional()
  @IsUUID()
  customOrderId?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'] as const)
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

