import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { HttpAuthGuard } from '../websocket/http-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { SocketUser } from '../websocket/interfaces/socket-user.interface';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { ReadReceiptDto } from './dto/read-receipt.dto';

@Controller('conversations')
@UseGuards(HttpAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  create(
    @CurrentUser() user: SocketUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(user, dto);
  }

  @Get()
  list(@CurrentUser() user: SocketUser, @Query() query: PaginationQueryDto) {
    return this.chatService.listConversations(user, query);
  }

  @Get(':id/messages')
  messages(
    @CurrentUser() user: SocketUser,
    @Param('id') conversationId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.chatService.getMessageHistory(user, conversationId, query);
  }

  @Post(':id/read')
  markRead(
    @CurrentUser() user: SocketUser,
    @Param('id') conversationId: string,
    @Body() body: Omit<ReadReceiptDto, 'conversationId'>,
  ) {
    return this.chatService.markRead(user, {
      conversationId,
      ...(body.messageIds !== undefined ? { messageIds: body.messageIds } : {}),
    });
  }
}
