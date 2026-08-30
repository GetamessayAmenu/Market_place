import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum BulkListingAction {
  approve = 'approve',
  reject = 'reject',
  request_changes = 'request_changes',
  archive = 'archive',
}

export class BulkListingActionDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  readonly listingIds!: string[];

  @IsEnum(BulkListingAction)
  readonly action!: BulkListingAction;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  readonly reason?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly reasons?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  readonly note?: string;
}
