import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { AdminChatsService } from './admin-chats.service';

@Controller('admin/chats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AdminChatsController {
  constructor(private readonly adminChatsService: AdminChatsService) {}

  @Get('metrics')
  getMetrics() {
    return this.adminChatsService.getMetrics();
  }

  @Get('threads')
  getFlaggedThreads(
    @Query('filter') filter: 'all' | 'flagged' | 'high_risk' | 'resolved' | 'suspended' = 'all',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminChatsService.getFlaggedThreads(
      filter,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Get('threads/:conversationId/messages')
  getThreadMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return this.adminChatsService.getThreadMessages(
      conversationId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Post('threads/:conversationId/resolve')
  resolveFlaggedThread(
    @Param('conversationId') conversationId: string,
    @Body() body: { adminId: string; action: 'DISMISS' | 'WARN_USER' | 'BAN_USER'; reason: string },
  ) {
    return this.adminChatsService.resolveFlaggedThread(
      conversationId,
      body.adminId,
      body.action,
      body.reason,
    );
  }
}
