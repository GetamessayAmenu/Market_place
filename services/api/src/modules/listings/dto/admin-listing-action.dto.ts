import { LISTING_STATUSES } from '@marketplace/types';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum AdminListingAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  ARCHIVE = 'archive',
  FEATURE = 'feature',
  UNFEATURE = 'unfeature',
}

export class AdminListingActionDto {
  @IsUUID()
  listingId!: string;

  @IsEnum(AdminListingAction)
  action!: AdminListingAction;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsEnum([...LISTING_STATUSES])
  overrideStatus?: (typeof LISTING_STATUSES)[number];
}

export class BulkAdminListingActionDto {
  @IsUUID()
  listingIds!: string[];

  @IsEnum(AdminListingAction)
  action!: AdminListingAction;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
