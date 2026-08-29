import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateFeaturedSellerDto {
  @IsString()
  sellerId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
