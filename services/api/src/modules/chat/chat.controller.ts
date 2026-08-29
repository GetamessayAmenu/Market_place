import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ChatService } from './chat.service';
import { MessageType } from '@prisma/client';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
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
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0
    );
  }

  @Post('conversations/find-or-create')
  async findOrCreateConversation(
    @Body() body: {
      sellerId: string;
      listingId?: string;
      orderId?: string;
      rentalId?: string;
      customOrderId?: string;
    },
    @CurrentUser() user: AuthenticatedUser
  ) {
    const context: { listingId?: string; orderId?: string; rentalId?: string; customOrderId?: string } = {};
    if (body.listingId) context.listingId = body.listingId;
    if (body.orderId) context.orderId = body.orderId;
    if (body.rentalId) context.rentalId = body.rentalId;
    if (body.customOrderId) context.customOrderId = body.customOrderId;

    return this.chatService.findOrCreateConversation(user, body.sellerId, context);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() body: {
      content: string;
      body?: string;
      messageType?: MessageType;
      attachments?: any;
      replyToId?: string;
    },
    @CurrentUser() user: AuthenticatedUser
  ) {
    const payload: { content: string; messageType?: MessageType; attachments?: any; replyToId?: string } = {
      content: body.content || body.body || '',
    };
    if (body.messageType) payload.messageType = body.messageType;
    if (body.attachments) payload.attachments = body.attachments;
    if (body.replyToId) payload.replyToId = body.replyToId;

    return this.chatService.sendMessage(conversationId, user, payload);
  }

  @Patch('messages/:id')
  async editMessage(
    @Param('id') messageId: string,
    @Body() body: { content: string },
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.editMessage(messageId, user, body.content);
  }

  @Delete('messages/:id')
  async deleteMessage(
    @Param('id') messageId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.deleteMessage(messageId, user);
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

  @Get('messages/search')
  async searchMessages(
    @Query('q') query: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.searchMessages(user, query || '');
  }

  // ─── Block & Report Controls ───────────────────────────────────────────────

  @Post('users/:userId/block')
  async blockUser(
    @Param('userId') targetUserId: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.blockUser(user, targetUserId, body.reason);
  }

  @Post('users/:userId/unblock')
  async unblockUser(
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.unblockUser(user, targetUserId);
  }

  @Get('users/blocked')
  async getBlockedUsers(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.getBlockedUsers(user);
  }

  @Post('reports')
  async reportMessageOrUser(
    @Body() body: {
      targetType: 'message' | 'user' | 'conversation';
      reportedUserId?: string;
      messageId?: string;
      conversationId?: string;
      reason: string;
      description?: string;
    },
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.reportMessageOrUser(user, body);
  }

  // ─── Seller Specific Endpoints ──────────────────────────────────────────────

  @Get('seller/conversations')
  @Roles('seller')
  async getSellerConversations(
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.getConversations(user, 'seller');
  }

  @Post('conversations/:id/quote')
  @Roles('seller')
  async sendQuote(
    @Param('id') conversationId: string,
    @Body() body: { proposedPrice: number; proposedDeposit?: number; notes?: string },
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.sendMessage(conversationId, user, {
      content: JSON.stringify({
        type: 'custom_quote',
        ...body,
        senderId: user.id,
      }),
      messageType: MessageType.CUSTOM_QUOTE,
    });
  }

  @Post('conversations/:id/quote/:quoteId/accept')
  async acceptQuote(
    @Param('id') conversationId: string,
    @Param('quoteId') quoteId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.chatService.sendMessage(conversationId, user, {
      content: JSON.stringify({
        type: 'quote_accepted',
        quoteId,
        senderId: user.id,
      }),
      messageType: MessageType.SYSTEM,
    });
  }
}
