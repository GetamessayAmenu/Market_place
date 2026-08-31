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
  async findAll(@Query() query: any) {
    try {
      const take = query.limit ? Number(query.limit) : 50;
      const page = query.page ? Number(query.page) : 1;
      return await this.heroBannersService.findAll({
        where: {
          deletedAt: null,
          ...(query.status ? { status: query.status } : {}),
        },
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * take,
        take,
      });
    } catch (err) {
      console.error('Error in HeroBannersController.findAll:', err);
      return {
        success: true,
        data: [],
        meta: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
  }

  @Get('active')
  @Public()
  async getActiveBanners() {
    try {
      return await this.heroBannersService.getActiveBanners();
    } catch (err) {
      console.error('Error in HeroBannersController.getActiveBanners:', err);
      return { success: true, data: [] };
    }
  }

  @Get('holiday/:theme')
  @Public()
  async getByHolidayTheme(@Param('theme') theme: string) {
    try {
      return await this.heroBannersService.getByHolidayTheme(theme);
    } catch (err) {
      console.error('Error in HeroBannersController.getByHolidayTheme:', err);
      return { success: true, data: [] };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.heroBannersService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateHeroBannerDto, @CurrentUser() user: AuthenticatedUser) {
    return await this.heroBannersService.create(dto, user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateHeroBannerDto>, @CurrentUser() user: AuthenticatedUser) {
    return await this.heroBannersService.update(id, dto, user);
  }

  @Patch(':id/publish')
  async publish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.heroBannersService.publish(id, user);
  }

  @Patch(':id/unpublish')
  async unpublish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.heroBannersService.unpublish(id, user);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.heroBannersService.delete(id, user);
  }
}
