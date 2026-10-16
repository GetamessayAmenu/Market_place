import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  SettingsQueryDto,
  UpdateFeatureFlagDto,
  UpdateSettingDto,
} from './dto/system-settings.dto';
import { SystemSettingsService } from './system-settings.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get('settings')
  @RequirePermission('settings.view')
  getSettings(@Query() query: SettingsQueryDto) {
    return this.systemSettingsService.getSettings(query.group ?? query.category);
  }

  @Patch('settings/:key')
  @RequirePermission('settings.manage')
  updateSetting(
    @CurrentUser() user: AuthenticatedUser,
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @Req() req: Request,
  ) {
    return this.systemSettingsService.updateSetting(
      user,
      key,
      dto.value,
      req.ip,
      req.get('user-agent'),
    );
  }

  @Get('feature-flags')
  @RequirePermission('feature_flags.view')
  getFeatureFlags() {
    return this.systemSettingsService.getFeatureFlags();
  }

  @Patch('feature-flags/:key')
  @RequirePermission('feature_flags.manage')
  updateFeatureFlag(
    @CurrentUser() user: AuthenticatedUser,
    @Param('key') key: string,
    @Body() dto: UpdateFeatureFlagDto,
    @Req() req: Request,
  ) {
    return this.systemSettingsService.updateFeatureFlag(
      user,
      key,
      dto.enabled,
      req.ip,
      req.get('user-agent'),
    );
  }
}
