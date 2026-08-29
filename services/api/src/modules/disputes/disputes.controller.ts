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
import { CreateDisputeCommentDto } from './dto/create-dispute-comment.dto';
import { CreateDisputeDto, EvidenceItemDto } from './dto/create-dispute.dto';
import { DisputeQueryDto } from './dto/dispute-query.dto';
import { AssignDisputeDto, EscalateDisputeDto, ReopenDisputeDto, RequestInfoDisputeDto, ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { TakeDisputeActionDto } from './dto/dispute-action.dto';
import { DisputesService } from './disputes.service';

@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  /** Authenticated user files a dispute */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDisputeDto) {
    return this.disputesService.create(user, dto);
  }

  /** Authenticated user views their filed or received disputes */
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser, @Query() query: DisputeQueryDto) {
    return this.disputesService.findMine(user, query);
  }

  /** Admin list disputes with full filters and search */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'moderator', 'support')
  @Get('admin/list')
  findAllAdmin(@Query() query: DisputeQueryDto) {
    return this.disputesService.findAll(query);
  }

  /** Admin stats overview */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'moderator', 'support')
  @Get('admin/stats')
  getDashboardStats() {
    return this.disputesService.getDashboardStats();
  }

  /** Get single dispute by ticket number */
  @UseGuards(JwtAuthGuard)
  @Get('ticket/:ticketNumber')
  findByTicketNumber(@Param('ticketNumber') ticketNumber: string) {
    return this.disputesService.findByTicketNumber(ticketNumber);
  }

  /** Get single dispute by ID (enforces user authorization or admin role) */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.disputesService.findOne(user, id);
  }

  /** Add evidence file to a dispute */
  @UseGuards(JwtAuthGuard)
  @Post(':id/evidence')
  addEvidence(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: EvidenceItemDto,
  ) {
    return this.disputesService.addEvidence(user, id, dto);
  }

  /** Update dispute details */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'moderator', 'support')
  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateDisputeDto) {
    return this.disputesService.update(user, id, dto);
  }

  /** Assign/reassign dispute to admin */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'moderator', 'support')
  @Patch(':id/assign')
  assignAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AssignDisputeDto,
  ) {
    return this.disputesService.assignAdmin(user, id, dto);
  }

  /** Update dispute status */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'moderator', 'support')
  @Patch(':id/status')
  updateStatus(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body('status') status: string) {
    return this.disputesService.updateStatus(user, id, status);
  }

  /** Request information from reporter/respondent */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'moderator', 'support')
  @Post(':id/request-info')
  requestInformation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RequestInfoDisputeDto,
  ) {
    return this.disputesService.requestInformation(user, id, dto);
  }

  /** Resolve dispute with outcome and reason */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'moderator', 'support')
  @Patch(':id/resolve')
  resolve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.disputesService.resolve(user, id, dto);
  }

  /** Escalate dispute */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'moderator', 'support')
  @Patch(':id/escalate')
  escalate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: EscalateDisputeDto) {
    return this.disputesService.escalate(user, id, dto);
  }

  /** Close dispute */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'moderator', 'support')
  @Patch(':id/close')
  close(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.disputesService.close(user, id);
  }

  /** Reopen dispute */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'moderator', 'support')
  @Patch(':id/reopen')
  reopen(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReopenDisputeDto,
  ) {
    return this.disputesService.reopen(user, id, dto);
  }

  /** Take administrative moderation action on user/listing from dispute */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'moderator')
  @Post(':id/action')
  takeAction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: TakeDisputeActionDto,
  ) {
    return this.disputesService.takeAction(user, id, dto);
  }

  /** Add comment or internal note to dispute */
  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  addComment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateDisputeCommentDto) {
    return this.disputesService.addComment(user, id, dto);
  }

  /** Get comments for dispute */
  @UseGuards(JwtAuthGuard)
  @Get(':id/comments')
  getComments(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.disputesService.getComments(user, id);
  }
}
