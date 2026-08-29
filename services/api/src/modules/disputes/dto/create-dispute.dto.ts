import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

export class EvidenceItemDto {
  @IsString()
  fileUrl!: string;

  @IsOptional()
  @IsString()
  fileName?: string | undefined;

  @IsOptional()
  @IsString()
  fileType?: string | undefined;

  @IsOptional()
  @IsNumber()
  fileSize?: number | undefined;

  @IsOptional()
  @IsString()
  cloudinaryPublicId?: string | undefined;
}

export class CreateDisputeDto {
  @IsOptional()
  @IsEnum(['off_platform_transaction', 'payment_dispute', 'delivery_issue', 'quality_mismatch', 'communication_conflict', 'other'] as const)
  type?: 'off_platform_transaction' | 'payment_dispute' | 'delivery_issue' | 'quality_mismatch' | 'communication_conflict' | 'other' | undefined;

  @IsOptional()
  @IsUUID()
  categoryId?: string | undefined;

  @IsOptional()
  @IsString()
  categorySlug?: string | undefined;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'] as const)
  priority?: 'low' | 'medium' | 'high' | 'urgent' | undefined;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsUUID()
  reportedUserId?: string | undefined;

  @IsOptional()
  @IsUUID()
  listingId?: string | undefined;

  @IsOptional()
  @IsUUID()
  orderId?: string | undefined;

  @IsOptional()
  @IsUUID()
  rentalId?: string | undefined;

  @IsOptional()
  @IsUUID()
  customOrderId?: string | undefined;

  @IsOptional()
  @IsUUID()
  conversationId?: string | undefined;

  @IsOptional()
  @IsUUID()
  reportId?: string | undefined;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidenceItemDto)
  evidence?: EvidenceItemDto[] | undefined;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[] | undefined;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  chatEvidenceIds?: string[] | undefined;
}
