import { IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class RecordEventDto {
  @IsNotEmpty()
  @IsString()
  eventType!: string;

  @IsOptional()
  @IsUUID()
  listingId?: string;

  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
