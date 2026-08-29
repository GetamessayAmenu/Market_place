import {
  Body,
  Controller,
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
import type { CreateDisputeCommentDto } from './dto/create-dispute-comment.dto';
import type { CreateDisputeDto } from './dto/create-dispute.dto';
import type { DisputeQueryDto } from './dto/dispute-query.dto';
import type { EscalateDisputeDto, ResolveDisputeDto } from './dto/resolve-dispute.dto';
import type { UpdateDisputeDto } from './dto/update-dispute.dto';
import { DisputesService } from './disputes.service';

@Controller('admin/disputes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'moderator', 'support')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Get()
  findAll(@Query() query: DisputeQueryDto) {
    return this.disputesService.findAll(query);
  }

  @Get('stats')
  getStatusCounts() {
    return this.disputesService.getStatusCounts();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.disputesService.findOne(id);
  }

  @Get('ticket/:ticketNumber')
  findByTicketNumber(@Param('ticketNumber') ticketNumber: string) {
    return this.disputesService.findByTicketNumber(ticketNumber);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDisputeDto) {
    return this.disputesService.create(user, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateDisputeDto) {
    return this.disputesService.update(user, id, dto);
  }

  @Patch(':id/status')
  updateStatus(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body('status') status: string) {
    return this.disputesService.updateStatus(user, id, status);
  }

  @Patch(':id/resolve')
  resolve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.disputesService.resolve(user, id, dto);
  }

  @Patch(':id/escalate')
  escalate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: EscalateDisputeDto) {
    return this.disputesService.escalate(user, id, dto);
  }

  @Patch(':id/close')
  close(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.disputesService.close(user, id);
  }

  @Post(':id/comments')
  addComment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateDisputeCommentDto) {
    return this.disputesService.addComment(user, id, dto);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string, @Query('includeInternal') includeInternal?: string) {
    return this.disputesService.getComments(id, includeInternal === 'true');
  }
}
