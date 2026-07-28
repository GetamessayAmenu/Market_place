import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { RentalsService } from './rentals.service';
import type { CreateRentalOrderDto } from './dto/create-rental-order.dto';
import type { UpdateRentalOrderDto } from './dto/update-rental-order.dto';
import type { RentalQueryDto } from './dto/rental-query.dto';
import type { CreateRentalExtensionDto } from './dto/create-rental-extension.dto';

@Controller('rentals')
@UseGuards(RolesGuard)
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get()
  findAll(@Query() query: RentalQueryDto) {
    return this.rentalsService.findAll(query);
  }

  @Get('my')
  @Roles('seller', 'buyer')
  getMyRentals(@CurrentUser() user: AuthenticatedUser) {
    return this.rentalsService.getUserRentals(user.id, 'renter');
  }

  @Get('seller')
  @Roles('seller')
  getSellerRentals(@CurrentUser() user: AuthenticatedUser) {
    return this.rentalsService.getUserRentals(user.id, 'seller');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rentalsService.findOne(id);
  }

  @Post()
  @Roles('buyer')
  create(@Body() dto: CreateRentalOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.rentalsService.create(dto, user);
  }

  @Patch(':id')
  @Roles('seller', 'buyer')
  update(@Param('id') id: string, @Body() dto: UpdateRentalOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.rentalsService.update(id, dto, user);
  }

  @Patch(':id/approve')
  @Roles('seller')
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rentalsService.approve(id, user);
  }

  @Post(':id/extensions')
  @Roles('seller', 'buyer')
  createExtension(
    @Param('id') id: string,
    @Body() dto: CreateRentalExtensionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalsService.createExtension(id, dto, user);
  }

  @Patch('extensions/:extensionId/approve')
  @Roles('seller', 'buyer')
  approveExtension(@Param('extensionId') extensionId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rentalsService.approveExtension(extensionId, user);
  }
}
