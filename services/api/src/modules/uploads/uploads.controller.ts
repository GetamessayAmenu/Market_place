import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SignedUploadDto } from './dto/signed-upload.dto';
import { ValidateUploadDto } from './dto/validate-upload.dto';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('sign')
  sign(@Body() dto: SignedUploadDto) {
    return this.uploadsService.createSignedUpload(dto.count ?? 1);
  }

  @Post('validate')
  validate(@Body() dto: ValidateUploadDto) {
    this.uploadsService.validateUploadFile(dto.mimeType, dto.bytes);
    return { valid: true };
  }
}
