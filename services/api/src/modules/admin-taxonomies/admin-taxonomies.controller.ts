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
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import type { CreateRegionalHubDto } from './dto/create-regional-hub.dto';
import type { CreateTaxonomyAttributeDto } from './dto/create-taxonomy-attribute.dto';
import type { CreateTaxonomyCategoryDto } from './dto/create-taxonomy-category.dto';
import type { AttributeQueryDto, RegionalHubQueryDto, TaxonomyQueryDto } from './dto/taxonomy-query.dto';
import { AdminTaxonomiesService } from './admin-taxonomies.service';

@Controller('admin/taxonomies')
@UseGuards(RolesGuard)
@Roles('super_admin', 'moderator')
export class AdminTaxonomiesController {
  constructor(private readonly taxonomiesService: AdminTaxonomiesService) {}

  // Categories
  @Get('categories')
  findCategories(@Query() query: TaxonomyQueryDto) {
    return this.taxonomiesService.findCategories(query);
  }

  @Get('categories/:id')
  findCategory(@Param('id') id: string) {
    return this.taxonomiesService.findCategory(id);
  }

  @Post('categories')
  createCategory(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTaxonomyCategoryDto) {
    return this.taxonomiesService.createCategory(user, dto);
  }

  @Patch('categories/:id')
  updateCategory(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: Partial<CreateTaxonomyCategoryDto>) {
    return this.taxonomiesService.updateCategory(user, id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.taxonomiesService.deleteCategory(user, id);
  }

  // Attributes
  @Get('attributes')
  findAttributes(@Query() query: AttributeQueryDto) {
    return this.taxonomiesService.findAttributes(query);
  }

  @Get('attributes/:id')
  findAttribute(@Param('id') id: string) {
    return this.taxonomiesService.findAttribute(id);
  }

  @Post('attributes')
  createAttribute(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTaxonomyAttributeDto) {
    return this.taxonomiesService.createAttribute(user, dto);
  }

  @Patch('attributes/:id')
  updateAttribute(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: Partial<CreateTaxonomyAttributeDto>) {
    return this.taxonomiesService.updateAttribute(user, id, dto);
  }

  @Delete('attributes/:id')
  deleteAttribute(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.taxonomiesService.deleteAttribute(user, id);
  }

  // Regional Hubs
  @Get('regional-hubs')
  getRegionalHubs(@Query() query: RegionalHubQueryDto) {
    return this.taxonomiesService.getRegionalHubs(query);
  }

  @Post('regional-hubs')
  createRegionalHub(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRegionalHubDto) {
    return this.taxonomiesService.createRegionalHub(user, dto);
  }

  @Patch('regional-hubs/:id')
  updateRegionalHub(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: Partial<CreateRegionalHubDto>) {
    return this.taxonomiesService.updateRegionalHub(user, id, dto);
  }

  @Delete('regional-hubs/:id')
  deleteRegionalHub(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.taxonomiesService.deleteRegionalHub(user, id);
  }

  @Get('regional-hubs/proximity')
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
