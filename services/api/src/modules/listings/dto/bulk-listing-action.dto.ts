import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum BulkListingAction {
  approve = 'approve',
  reject = 'reject',
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
  @MaxLength(500)
  readonly reason?: string;
}
