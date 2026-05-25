import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { MAX_LISTING_IMAGES } from '@marketplace/config';

export class SignedUploadDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LISTING_IMAGES)
  count?: number = 1;
}
