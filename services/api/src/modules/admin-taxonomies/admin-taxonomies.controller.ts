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

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import type { CreateRegionalHubDto } from './dto/create-regional-hub.dto';
import type { CreateTaxonomyAttributeDto } from './dto/create-taxonomy-attribute.dto';
import type { AttributeQueryDto, RegionalHubQueryDto, TaxonomyQueryDto } from './dto/taxonomy-query.dto';
import { AdminTaxonomiesService } from './admin-taxonomies.service';

@Controller('admin/taxonomies')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin', 'super_admin', 'platform_admin')
export class AdminTaxonomiesController {
  constructor(private readonly taxonomiesService: AdminTaxonomiesService) {}

  // Categories
  @Get('categories')
  @RequirePermission('categories.view')
  findCategories(@Query() query: TaxonomyQueryDto) {
    return this.taxonomiesService.findCategories(query);
  }

  @Get('categories/:id')
  @RequirePermission('categories.view')
  findCategory(@Param('id') id: string) {
    return this.taxonomiesService.findCategory(id);
  }

  @Post('categories')
  @RequirePermission('categories.manage')
  createCategory(@CurrentUser() user: AuthenticatedUser, @Body() dto: any) {
    // Remove parentId if it's empty string or null
    if (dto.parentId === '' || dto.parentId === null) {
      delete dto.parentId;
    }
    return this.taxonomiesService.createCategory(user, dto);
  }

  @Patch('categories/:id')
  @RequirePermission('categories.manage')
  updateCategory(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: any) {
    // Remove parentId if it's empty string or null
    if (dto.parentId === '' || dto.parentId === null) {
      delete dto.parentId;
    }
    return this.taxonomiesService.updateCategory(user, id, dto);
  }

  @Delete('categories/:id')
  @RequirePermission('categories.manage')
  deleteCategory(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.taxonomiesService.deleteCategory(user, id);
  }

  // Attributes
  @Get('attributes')
  @RequirePermission('categories.view')
  findAttributes(@Query() query: AttributeQueryDto) {
    return this.taxonomiesService.findAttributes(query);
  }

  @Get('attributes/:id')
  @RequirePermission('categories.view')
  findAttribute(@Param('id') id: string) {
    return this.taxonomiesService.findAttribute(id);
  }

  @Post('attributes')
  @RequirePermission('categories.manage')
  createAttribute(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTaxonomyAttributeDto) {
    return this.taxonomiesService.createAttribute(user, dto);
  }

  @Patch('attributes/:id')
  @RequirePermission('categories.manage')
  updateAttribute(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: Partial<CreateTaxonomyAttributeDto>) {
    return this.taxonomiesService.updateAttribute(user, id, dto);
  }

  @Delete('attributes/:id')
  @RequirePermission('categories.manage')
  deleteAttribute(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.taxonomiesService.deleteAttribute(user, id);
  }

  // Regional Hubs
  @Get('regional-hubs')
  @RequirePermission('categories.view')
  getRegionalHubs(@Query() query: RegionalHubQueryDto) {
    return this.taxonomiesService.getRegionalHubs(query);
  }

  @Post('regional-hubs')
  @RequirePermission('categories.manage')
  createRegionalHub(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRegionalHubDto) {
    return this.taxonomiesService.createRegionalHub(user, dto);
  }

  @Patch('regional-hubs/:id')
  @RequirePermission('categories.manage')
  updateRegionalHub(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: Partial<CreateRegionalHubDto>) {
    return this.taxonomiesService.updateRegionalHub(user, id, dto);
  }

  @Delete('regional-hubs/:id')
  @RequirePermission('categories.manage')
  deleteRegionalHub(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.taxonomiesService.deleteRegionalHub(user, id);
  }

  @Get('regional-hubs/proximity')
  @RequirePermission('categories.view')
  getRegionalHubsByProximity(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.taxonomiesService.getRegionalHubsByProximity(
      Number(lat),
      Number(lng),
      radius ? Number(radius) : undefined,
    );
  }
}
