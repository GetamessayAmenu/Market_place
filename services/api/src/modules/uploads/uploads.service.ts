import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ALLOWED_LISTING_IMAGE_MIME_TYPES,
  MAX_LISTING_IMAGE_BYTES,
  MAX_LISTING_IMAGES,
} from '@marketplace/config';
import { v2 as cloudinary } from 'cloudinary';

import { ApiConfigService } from '../../infrastructure/config/api-config.service';
import { LISTING_UPLOAD_FOLDER } from '../listings/constants/listings.constants';

export interface SignedUploadParams {
  readonly timestamp: number;
  readonly signature: string;
  readonly apiKey: string;
  readonly cloudName: string;
  readonly folder: string;
  readonly uploadPreset?: string;
  readonly transformation?: string;
}

@Injectable()
export class UploadsService {
  constructor(private readonly config: ApiConfigService) {
    if (this.config.isCloudinaryConfigured) {
      cloudinary.config({
        cloud_name: this.config.cloudinaryCloudName!,
        api_key: this.config.cloudinaryApiKey!,
        api_secret: this.config.cloudinaryApiSecret!,
        secure: true,
      });
    }
  }

  assertConfigured(): void {
    if (!this.config.isCloudinaryConfigured) {
      throw new ServiceUnavailableException({
        code: 'CLOUDINARY_NOT_CONFIGURED',
        message: 'Image upload is not configured',
      });
    }
  }

  validateUploadFile(mimeType: string, bytes: number): void {
    if (!(ALLOWED_LISTING_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) {
      throw new BadRequestException({
        code: 'INVALID_IMAGE_TYPE',
        message: `Allowed types: ${ALLOWED_LISTING_IMAGE_MIME_TYPES.join(', ')}`,
      });
    }
    if (bytes > MAX_LISTING_IMAGE_BYTES) {
      throw new BadRequestException({
        code: 'IMAGE_TOO_LARGE',
        message: `Max size is ${MAX_LISTING_IMAGE_BYTES} bytes`,
      });
    }
  }

  createSignedUpload(count = 1): SignedUploadParams[] {
    this.assertConfigured();
    const capped = Math.min(count, MAX_LISTING_IMAGES);
    const timestamp = Math.round(Date.now() / 1000);
    const folder = LISTING_UPLOAD_FOLDER;

    return Array.from({ length: capped }, () => {
      const paramsToSign = {
        timestamp,
        folder,
      };
      const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        this.config.cloudinaryApiSecret!,
      );

      return {
        timestamp,
        signature,
        apiKey: this.config.cloudinaryApiKey!,
        cloudName: this.config.cloudinaryCloudName!,
        folder,
        transformation: 'c_limit,w_1200,h_1200/q_auto/f_auto',
      };
    });
  }

  buildImageUrl(publicId: string, options?: { readonly thumbnail?: boolean }): string {
    this.assertConfigured();
    const transformation = options?.thumbnail
      ? 'c_fill,w_400,h_400/q_auto/f_auto'
      : 'c_limit,w_1200,h_1200/q_auto/f_auto';
    return cloudinary.url(publicId, {
      secure: true,
      transformation: [{ raw_transformation: transformation }],
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    this.assertConfigured();
    await cloudinary.uploader.destroy(publicId);
  }

  async deleteImages(publicIds: readonly string[]): Promise<void> {
    if (!publicIds.length) {
      return;
    }
    this.assertConfigured();
    await Promise.all(publicIds.map((id) => cloudinary.uploader.destroy(id)));
  }
}
