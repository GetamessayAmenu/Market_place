import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateFeaturedListingDto {
  @IsString()
  listingId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
