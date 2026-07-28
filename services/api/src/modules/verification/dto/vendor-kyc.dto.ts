import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVendorKycDto {
  @IsString()
  @MaxLength(200)
  businessName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessNameAm?: string;

  @IsString()
  @MaxLength(15)
  tinNumber!: string;

  @IsString()
  @MaxLength(500)
  licenseUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  licenseCloudinaryId?: string;
}

export class ReviewVendorKycDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class VendorKycQueryDto {
  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED'])
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  tinNumber?: string;
}
