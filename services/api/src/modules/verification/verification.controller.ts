import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

import type { AdminVerificationQueryDto, ReviewVerificationDto, VerifyTokenDto } from './dto/verification.dto';
import { VerificationAdminService } from './verification-admin.service';

@Controller()
export class VerificationController {
  constructor(private readonly verificationAdminService: VerificationAdminService) {}

  /** Public: verify email token */
  @Public()
  @Post('auth/verify/email')
  verifyEmail(@Body() dto: VerifyTokenDto) {
    return this.verificationAdminService.verifyEmail(dto.token);
  }

  /** Public: verify phone token */
  @Public()
  @Post('auth/verify/phone')
  verifyPhone(@Body() dto: VerifyTokenDto) {
    return this.verificationAdminService.verifyPhone(dto.token);
  }

  /** Admin: list all verification requests */
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'moderator', 'support')
  @Get('admin/verifications')
  findAll(@Query() query: AdminVerificationQueryDto) {
    return this.verificationAdminService.findAll(query);
  }

  /** Admin: review a verification request */
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'moderator')
  @Patch('admin/verifications/:id')
  review(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.verificationAdminService.review({ id: admin.id }, id, dto);
  }
}
