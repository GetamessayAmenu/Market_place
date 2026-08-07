import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { RentalsService } from './rentals.service';
import type { CreateRentalOrderDto } from './dto/create-rental-order.dto';
import type { UpdateRentalOrderDto } from './dto/update-rental-order.dto';
import type { RentalQueryDto } from './dto/rental-query.dto';
import type { CreateRentalExtensionDto } from './dto/create-rental-extension.dto';
import type { CreateConditionLogDto } from './dto/create-condition-log.dto';
import type { CreateBlackoutDateDto } from './dto/create-blackout-date.dto';

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

  // Condition Log endpoints
  @Post(':id/condition-logs')
  @Roles('seller', 'buyer')
  createConditionLog(
    @Param('id') id: string,
    @Body() dto: CreateConditionLogDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalsService.createConditionLog(id, dto, user);
  }

  @Get(':id/condition-logs')
  @Roles('seller', 'buyer')
  getConditionLogs(@Param('id') id: string) {
    return this.rentalsService.getConditionLogs(id);
  }

  // Blackout Date endpoints
  @Post('blackout-dates')
  @Roles('seller')
  createBlackoutDate(@Body() dto: CreateBlackoutDateDto, @CurrentUser() user: AuthenticatedUser) {
    return this.rentalsService.createBlackoutDate(dto, user);
  }

  @Get('blackout-dates/:listingId')
  @Roles('seller', 'buyer')
  getBlackoutDates(@Param('listingId') listingId: string) {
    return this.rentalsService.getBlackoutDates(listingId);
  }

  @Delete('blackout-dates/:id')
  @Roles('seller')
  deleteBlackoutDate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rentalsService.deleteBlackoutDate(id, user);
  }

  // Dispute endpoint
  @Patch(':id/dispute')
  @Roles('seller', 'buyer')
  flagAsDisputed(
    @Param('id') id: string,
    @Body() body: { reason: string; evidencePhotos: string[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalsService.flagAsDisputed(id, body.reason, body.evidencePhotos, user);
  }
}
