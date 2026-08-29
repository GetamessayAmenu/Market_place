import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { HeroBannersService } from './hero-banners.service';
import type { CreateHeroBannerDto } from './dto/create-hero-banner.dto';

import { Public } from '../../common/decorators/public.decorator';

@Controller('admin/hero-banners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin', 'moderator')
export class HeroBannersController {
  constructor(private readonly heroBannersService: HeroBannersService) {}

  @Get()
  findAll(@Query() query: any) {
    const take = query.limit ? Number(query.limit) : 20;
    return this.heroBannersService.findAll({
      ...(query.status ? { where: { status: query.status } } : {}),
      orderBy: { sortOrder: 'asc' },
      skip: query.page ? (Number(query.page) - 1) * (query.limit || 20) : 0,
      take,
    });
  }

  @Get('active')
  @Public()
  getActiveBanners() {
    return this.heroBannersService.getActiveBanners();
  }

  @Get('holiday/:theme')
  @Public()
  getByHolidayTheme(@Param('theme') theme: string) {
    return this.heroBannersService.getByHolidayTheme(theme);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.heroBannersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateHeroBannerDto, @CurrentUser() user: AuthenticatedUser) {
    return this.heroBannersService.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateHeroBannerDto>, @CurrentUser() user: AuthenticatedUser) {
    return this.heroBannersService.update(id, dto, user);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.heroBannersService.publish(id, user);
  }

  @Patch(':id/unpublish')
  unpublish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.heroBannersService.unpublish(id, user);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.heroBannersService.delete(id, user);
  }
}
