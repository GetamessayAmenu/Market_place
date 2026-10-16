import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesService } from './categories.service';

@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'super_admin', 'platform_admin')
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermission('categories.view')
  findAll(@Query() query: { page?: number; limit?: number; type?: string; search?: string; isActive?: boolean }) {
    return this.categoriesService.findAllAdmin(query);
  }

  @Get(':id')
  @RequirePermission('categories.view')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOneAdmin(id);
  }

  @Post()
  @RequirePermission('categories.manage')
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('categories.manage')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('categories.manage')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
