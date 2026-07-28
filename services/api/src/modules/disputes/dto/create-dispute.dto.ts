import { IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDisputeDto {
  @IsEnum(['off_platform_transaction', 'payment_dispute', 'delivery_issue', 'quality_mismatch', 'communication_conflict', 'other'] as const)
  type!: 'off_platform_transaction' | 'payment_dispute' | 'delivery_issue' | 'quality_mismatch' | 'communication_conflict' | 'other';

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'] as const)
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsUUID()
  reportedUserId?: string;

  @IsOptional()
  @IsUUID()
  listingId?: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  chatEvidenceIds?: string[];
}
