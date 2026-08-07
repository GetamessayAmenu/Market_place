import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRentalOrderDto {
  @IsOptional()
  @IsEnum(['REQUESTED', 'APPROVED', 'HANDOVER_PENDING', 'ACTIVE', 'RETURN_INITIATED', 'RETURNED_PENDING_INSPECTION', 'COMPLETED', 'DECLINED', 'EXPIRED', 'CANCELLED', 'DISPUTED'])
  status?: 'REQUESTED' | 'APPROVED' | 'HANDOVER_PENDING' | 'ACTIVE' | 'RETURN_INITIATED' | 'RETURNED_PENDING_INSPECTION' | 'COMPLETED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED' | 'DISPUTED';

  @IsOptional()
  @IsDateString()
  handoverAt?: string;

  @IsOptional()
  @IsDateString()
  returnedAt?: string;

  @IsOptional()
  @IsDateString()
  actualReturnDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  preHandoverCondition?: string;

  @IsOptional()
  preHandoverPhotos?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  postReturnCondition?: string;

  @IsOptional()
  postReturnPhotos?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  damageNotes?: string;

  @IsOptional()
  @IsNumber()
  damageCost?: number;

  @IsOptional()
  depositRefunded?: boolean;

  @IsOptional()
  @IsNumber()
  depositRefundAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  depositRefundReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pickupHub?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  offlineDepositStatus?: string;
}
