import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HomepageContentService } from './homepage-content.service';
import type { CreateHomepageContentDto } from './dto/create-homepage-content.dto';
import type { UpdateHomepageContentDto } from './dto/update-homepage-content.dto';
import type { HomepageContentQueryDto } from './dto/homepage-content-query.dto';
import type { ReorderHomepageContentDto } from './dto/reorder-homepage-content.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@Controller('admin/homepage-content')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HomepageContentController {
  constructor(private readonly homepageContentService: HomepageContentService) {}

  @Get()
  @Roles('admin', 'super_admin')
  async findAll(@Query() query: HomepageContentQueryDto) {
    return this.homepageContentService.findAll(query);
  }

  @Get('published')
  async getPublishedContent() {
    return this.homepageContentService.getPublishedContent();
  }

  @Get(':id')
  @Roles('admin', 'super_admin')
  async findOne(@Param('id') id: string) {
    return this.homepageContentService.findOne(id);
  }

  @Post()
  @Roles('admin', 'super_admin')
  async create(
    @Body() dto: CreateHomepageContentDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.homepageContentService.create(dto, admin);
  }

  @Put(':id')
  @Roles('admin', 'super_admin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHomepageContentDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.homepageContentService.update(id, dto, admin);
  }

  @Delete(':id')
  @Roles('admin', 'super_admin')
  async remove(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.homepageContentService.remove(id, admin);
  }

  @Post(':id/restore')
  @Roles('admin', 'super_admin')
  async restore(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.homepageContentService.restore(id, admin);
  }

  @Post('reorder')
  @Roles('admin', 'super_admin')
  async reorder(
    @Body() dto: ReorderHomepageContentDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.homepageContentService.reorder(dto, admin);
  }
}
