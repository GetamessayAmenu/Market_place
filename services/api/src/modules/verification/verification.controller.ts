import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

import type { AdminVerificationQueryDto, ReviewVerificationDto, VerifyTokenDto } from './dto/verification.dto';
import type { GrantVerifiedDesignerDto, RevokeVerifiedDesignerDto } from './dto/verified-designer.dto';
import type { CreateVendorKycDto, ReviewVendorKycDto, VendorKycQueryDto } from './dto/vendor-kyc.dto';
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

  /** Admin: grant verified designer badge */
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'moderator')
  @Post('admin/users/:userId/verified-designer')
  grantVerifiedDesigner(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: GrantVerifiedDesignerDto,
  ) {
    return this.verificationAdminService.grantVerifiedDesigner({ id: admin.id }, userId, dto);
  }

  /** Admin: revoke verified designer badge */
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'moderator')
  @Delete('admin/users/:userId/verified-designer')
  revokeVerifiedDesigner(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: RevokeVerifiedDesignerDto,
  ) {
    return this.verificationAdminService.revokeVerifiedDesigner({ id: admin.id }, userId, dto);
  }

  /** Admin: list vendor KYC profiles */
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'moderator')
  @Get('admin/vendor-kyc')
  findVendorKycProfiles(@Query() query: VendorKycQueryDto) {
    return this.verificationAdminService.findVendorKycProfiles(query);
  }

  /** Admin: get single vendor KYC profile */
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'moderator')
  @Get('admin/vendor-kyc/:id')
  findVendorKycProfile(@Param('id') id: string) {
    return this.verificationAdminService.findVendorKycProfile(id);
  }

  /** Admin: review vendor KYC profile */
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin', 'moderator')
  @Patch('admin/vendor-kyc/:id/review')
  reviewVendorKyc(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReviewVendorKycDto,
  ) {
    return this.verificationAdminService.reviewVendorKyc({ id: admin.id }, id, dto);
  }

  /** Seller: create vendor KYC profile */
  @UseGuards(RolesGuard)
  @Roles('seller')
  @Post('vendor-kyc')
  createVendorKycProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVendorKycDto) {
    return this.verificationAdminService.createVendorKycProfile(user.id, dto);
  }
}
