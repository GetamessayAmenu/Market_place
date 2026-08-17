import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { OrderQueryDto } from './dto/order-query.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { RequestExtensionDto, RespondExtensionDto } from './dto/rental-extension.dto';
import { UpdateTailoringMilestoneDto } from './dto/tailoring-milestone.dto';
import { DeclineOrderDto } from './dto/decline-order.dto';
import { AlternativeDateSuggestionDto } from './dto/alternative-date.dto';
import { OrdersService } from './orders.service';

@Controller('admin/orders')
@UseGuards(RolesGuard)
@Roles('admin', 'super_admin')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get('number/:orderNumber')
  findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }
}

@Controller('orders')
@UseGuards(RolesGuard)
@Roles('buyer', 'seller')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('buyer')
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.create(user, dto);
  }

  @Get('my')
  @Roles('buyer')
  getMyOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findAll({ buyerId: user.id });
  }

  @Get('seller')
  @Roles('seller')
  getSellerOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findAll({ sellerId: user.id });
  }

  @Get('upload-signature')
  getUploadSignature(@Query('count') count?: string) {
    return this.ordersService.generateUploadSignature(count ? parseInt(count) : 1);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.updateOrderStatus(id, user, dto);
  }

  @Patch(':id/status')
  @Roles('seller')
  patchStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.updateOrderStatus(id, user, dto);
  }

  @Post(':id/quotes')
  @Roles('seller')
  createQuote(
    @Param('id') id: string,
    @Body() dto: CreateQuoteDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.createQuote(id, user, dto);
  }

  @Post(':id/quotes/:quoteId/accept')
  @Roles('buyer')
  acceptQuote(
    @Param('id') id: string,
    @Param('quoteId') quoteId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.acceptQuote(id, quoteId, user);
  }

  @Get(':id/next-states')
  getNextStates(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.getValidNextStates(id, user);
  }

  @Post(':id/pre-handover-photos')
  @Roles('seller')
  uploadPreHandoverPhotos(
    @Param('id') id: string,
    @Body() body: { photoUrls: string[] },
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.uploadPreHandoverPhotos(id, user, body.photoUrls);
  }

  @Post(':id/post-return-photos')
  @Roles('seller')
  uploadPostReturnPhotos(
    @Param('id') id: string,
    @Body() body: { photoUrls: string[] },
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.uploadPostReturnPhotos(id, user, body.photoUrls);
  }

  // ─── Seller Order Actions ────────────────────────────────────────────────

  @Post(':id/decline')
  @Roles('seller')
  declineOrder(
    @Param('id') id: string,
    @Body() dto: DeclineOrderDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.declineOrder(id, user, dto);
  }

  @Post(':id/alternative-dates')
  @Roles('seller')
  proposeAlternativeDates(
    @Param('id') id: string,
    @Body() dto: AlternativeDateSuggestionDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.proposeAlternativeDates(id, user, dto);
  }

  @Put(':id/tailoring-milestone')
  @Roles('seller')
  updateTailoringMilestone(
    @Param('id') id: string,
    @Body() dto: UpdateTailoringMilestoneDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.updateTailoringMilestone(id, user, dto);
  }

  @Post(':id/extension/request')
  @Roles('buyer')
  requestRentalExtension(
    @Param('id') id: string,
    @Body() dto: RequestExtensionDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.requestRentalExtension(id, user, dto);
  }

  @Post(':id/extension/respond')
  @Roles('seller')
  respondRentalExtension(
    @Param('id') id: string,
    @Body() dto: RespondExtensionDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.respondRentalExtension(id, user, dto);
  }

  @Post(':id/complete-inspection')
  @Roles('seller')
  completeOrderWithInspection(
    @Param('id') id: string,
    @Body() data: { condition: 'good' | 'damaged'; damageNotes?: string; deductionAmount?: number },
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.ordersService.completeOrderWithInspection(id, user, data);
  }
}
