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
import { RentalsService } from './rentals.service';
import type { CreateRentalOrderDto } from './dto/create-rental-order.dto';
import type { UpdateRentalOrderDto } from './dto/update-rental-order.dto';
import type { RentalQueryDto } from './dto/rental-query.dto';
import type { CreateRentalExtensionDto } from './dto/create-rental-extension.dto';
import type { CreateConditionLogDto } from './dto/create-condition-log.dto';
import type { CreateBlackoutDateDto } from './dto/create-blackout-date.dto';
import type { SuggestDatesDto } from './dto/suggest-dates.dto';
import type { RespondDatesDto } from './dto/respond-dates.dto';
import type { DeclineRentalDto } from './dto/decline-rental.dto';
import type { CancelRentalDto } from './dto/cancel-rental.dto';
import type { ConfirmReturnDto } from './dto/confirm-return.dto';
import type { InitiateReturnDto } from './dto/initiate-return.dto';

@Controller('rentals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Get()
  @Roles('admin', 'super_admin')
  findAll(@Query() query: RentalQueryDto) {
    return this.rentalsService.findAll(query);
  }

  @Get('my')
  @Roles('seller', 'buyer', 'admin')
  getMyRentals(@CurrentUser() user: AuthenticatedUser, @Query('status') status?: string) {
    return this.rentalsService.getUserRentals(user.id, 'renter', status);
  }

  @Get('seller')
  @Roles('seller', 'admin')
  getSellerRentals(@CurrentUser() user: AuthenticatedUser, @Query('status') status?: string) {
    return this.rentalsService.getUserRentals(user.id, 'seller', status);
  }

  @Get('availability/:listingId')
  @Roles('seller', 'buyer', 'admin')
  checkAvailability(
    @Param('listingId') listingId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.rentalsService.checkAvailability(listingId, startDate, endDate);
  }

  @Get('booked-dates/:listingId')
  @Roles('seller', 'buyer', 'admin')
  getBookedDates(@Param('listingId') listingId: string) {
    return this.rentalsService.getBookedDateRanges(listingId);
  }

  @Get(':id')
  @Roles('seller', 'buyer', 'admin')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rentalsService.findOne(id, user);
  }

  @Post()
  @Roles('buyer', 'seller')
  create(@Body() dto: CreateRentalOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.rentalsService.create(dto, user);
  }

  @Patch(':id')
  @Roles('seller', 'buyer', 'admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRentalOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalsService.update(id, dto, user);
  }

  // Seller accepts rental request
  @Patch(':id/approve')
  @Roles('seller', 'admin')
  approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rentalsService.approve(id, user);
  }

  @Post(':id/accept')
  @Roles('seller', 'admin')
  accept(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rentalsService.approve(id, user);
  }

  // Seller suggests alternative dates
  @Post(':id/suggest-dates')
  @Roles('seller', 'admin')
  suggestDates(
    @Param('id') id: string,
    @Body() dto: SuggestDatesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalsService.suggestDates(id, dto, user);
  }

  // Renter accepts or declines suggested dates
  @Post(':id/respond-dates')
  @Roles('buyer', 'seller')
  respondDates(
    @Param('id') id: string,
    @Body() dto: RespondDatesDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalsService.respondSuggestedDates(id, dto, user);
  }

  // Seller declines rental request
  @Post(':id/decline')
  @Roles('seller', 'admin')
  decline(
    @Param('id') id: string,
    @Body() dto: DeclineRentalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalsService.decline(id, dto, user);
  }

  // Renter or seller cancels rental
  @Post(':id/cancel')
  @Roles('buyer', 'seller', 'admin')
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelRentalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalsService.cancel(id, dto, user);
  }

  // Seller marks ready for pickup
  @Post(':id/ready')
  @Roles('seller', 'admin')
  markReady(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rentalsService.markReadyForPickup(id, user);
  }

  // Seller marks item as picked up -> ACTIVE
  @Post(':id/start')
  @Roles('seller', 'admin')
  startRental(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rentalsService.startRental(id, user);
  }

  // Renter or seller initiates return -> RETURN_PENDING
  @Post(':id/return')
  @Roles('buyer', 'seller')
  initiateReturn(
    @Param('id') id: string,
    @Body() dto: InitiateReturnDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalsService.initiateReturn(id, user, dto);
  }

  // Seller confirms return -> COMPLETED
  @Post(':id/confirm-return')
  @Roles('seller', 'admin')
  confirmReturn(
    @Param('id') id: string,
    @Body() dto: ConfirmReturnDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalsService.confirmReturn(id, user, dto);
  }

  @Post(':id/complete')
  @Roles('seller', 'admin')
  complete(
    @Param('id') id: string,
    @Body() dto: ConfirmReturnDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalsService.confirmReturn(id, user, dto);
  }

  // Rental extensions
  @Post(':id/extensions')
  @Roles('buyer', 'seller')
  createExtension(
    @Param('id') id: string,
    @Body() dto: CreateRentalExtensionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalsService.createExtension(id, dto, user);
  }

  @Patch('extensions/:extensionId/approve')
  @Roles('seller', 'admin')
  approveExtension(
    @Param('extensionId') extensionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalsService.approveExtension(extensionId, user);
  }

  @Post('extensions/:extensionId/accept')
  @Roles('seller', 'admin')
  acceptExtension(
    @Param('extensionId') extensionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalsService.approveExtension(extensionId, user);
  }

  @Post('extensions/:extensionId/decline')
  @Roles('seller', 'admin')
  declineExtension(
    @Param('extensionId') extensionId: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.rentalsService.declineExtension(extensionId, body?.reason, user);
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
  @Roles('seller', 'buyer', 'admin')
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
  @Roles('seller', 'buyer', 'admin')
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
