import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(RolesGuard)
@Roles('buyer', 'seller')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations(@CurrentUser() user: AuthenticatedUser) {
    const role = user.role === 'seller' ? 'seller' : 'buyer';
    return this.chatService.getConversations(user, role);
  }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getConversation(id, user);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Param('id') conversationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    return this.chatService.getMessages(
      conversationId,
      user,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0
    );
  }

  @Post('conversations/find-or-create')
  async findOrCreateConversation(
    @Body() body: { sellerId: string; listingId?: string },
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.findOrCreateConversation(user, body.sellerId, body.listingId);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() body: { body: string },
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.sendMessage(conversationId, user, body.body);
  }

  @Post('conversations/:id/read')
  async markAsRead(@Param('id') conversationId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.chatService.markAsRead(conversationId, user);
    return { success: true };
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.chatService.getUnreadCount(user);
    return { count };
  }
}
