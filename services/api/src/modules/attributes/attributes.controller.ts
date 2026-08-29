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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { AttributeQueryDto } from './dto/attribute-query.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { AttributesService } from './attributes.service';

@Controller('admin/attributes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  findAll(@Query() query: AttributeQueryDto) {
    return this.attributesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attributesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAttributeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.attributesService.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAttributeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attributesService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.attributesService.remove(id, user.id);
  }

  @Post(':id/reorder')
  reorder(
    @Param('id') id: string,
    @Body() dto: { newOrder: number },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attributesService.reorder(id, dto.newOrder, user.id);
  }
}
