import { ALLOWED_LISTING_IMAGE_MIME_TYPES } from '@marketplace/config';
import { IsIn, IsInt, Max, Min } from 'class-validator';

export class ValidateUploadDto {
  @IsIn([...ALLOWED_LISTING_IMAGE_MIME_TYPES])
  mimeType!: (typeof ALLOWED_LISTING_IMAGE_MIME_TYPES)[number];

  @IsInt()
  @Min(1)
  @Max(5 * 1024 * 1024)
  bytes!: number;
}
