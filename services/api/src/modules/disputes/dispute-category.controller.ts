import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateDisputeCategoryDto, UpdateDisputeCategoryDto } from './dto/dispute-category.dto';
import { DisputesService } from './disputes.service';

@Controller('dispute-categories')
export class DisputeCategoryController {
  constructor(private readonly disputesService: DisputesService) {}

  /** Anyone authenticated can fetch active dispute categories for filing forms */
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.disputesService.findAllCategories();
  }

  /** Admin/Support can create new categories */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDisputeCategoryDto) {
    return this.disputesService.createCategory(user, dto);
  }

  /** Admin/Support can update categories */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDisputeCategoryDto,
  ) {
    return this.disputesService.updateCategory(user, id, dto);
  }

  /** Admin/Support can delete categories */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @Delete(':id')
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.disputesService.deleteCategory(user, id);
  }
}
