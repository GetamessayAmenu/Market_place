import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { SignedUploadDto } from './dto/signed-upload.dto';
import { ValidateUploadDto } from './dto/validate-upload.dto';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(PermissionsGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Permissions({ resource: 'listing', action: 'create' })
  @Post('sign')
  sign(@Body() dto: SignedUploadDto) {
    return this.uploadsService.createSignedUpload(dto.count ?? 1);
  }

  @Permissions({ resource: 'listing', action: 'create' })
  @Post('validate')
  validate(@Body() dto: ValidateUploadDto) {
    this.uploadsService.validateUploadFile(dto.mimeType, dto.bytes);
    return { valid: true };
  }
}
