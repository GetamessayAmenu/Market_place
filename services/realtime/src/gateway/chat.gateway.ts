import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { ChatService } from '../chat/chat.service';
import { JoinConversationDto } from '../chat/dto/join-conversation.dto';
import { ReadReceiptDto } from '../chat/dto/read-receipt.dto';
import { SendMessageSocketDto } from '../chat/dto/send-message.dto';
import { TypingEventDto } from '../chat/dto/typing-event.dto';
import {
  CHAT_CLIENT_EVENTS,
  CHAT_SERVER_EVENTS,
  conversationRoomId,
} from '../events.constants';
import { PresenceService } from '../presence/presence.service';
import { SocketAuthMiddleware } from '../websocket/socket-auth.middleware';
import { SocketAuthService } from '../websocket/socket-auth.service';
import { ChatRateLimitService } from './chat-rate-limit.service';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  transports: ['websocket', 'polling'],
})
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly socketAuth: SocketAuthService,
    private readonly socketAuthMiddleware: SocketAuthMiddleware,
    private readonly presenceService: PresenceService,
    private readonly rateLimit: ChatRateLimitService,
  ) {}

  afterInit(server: Server): void {
    server.use(this.socketAuthMiddleware.use);
    this.logger.log('Chat gateway initialized');
  }

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const user = this.socketAuth.getSocketUser(socket);
      const isFirst = await this.presenceService.registerConnection(user.id, socket.id);

      await socket.join(this.userRoom(user.id));

      if (isFirst) {
        const lastSeen = await this.presenceService.getLastSeen(user.id);
        this.server.emit(
          CHAT_SERVER_EVENTS.USER_ONLINE,
          this.presenceService.presencePayload(user.id, true, lastSeen),
        );
      }
    } catch (error) {
      this.logger.warn(`Connection rejected: ${(error as Error).message}`);
      socket.disconnect(true);
    }
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    const { userId, wentOffline } = await this.presenceService.unregisterConnection(
      socket.id,
    );
    if (userId && wentOffline) {
      const lastSeen = await this.presenceService.getLastSeen(userId);
      this.server.emit(
        CHAT_SERVER_EVENTS.USER_OFFLINE,
        this.presenceService.presencePayload(userId, false, lastSeen),
      );
    }
  }

  @SubscribeMessage(CHAT_CLIENT_EVENTS.JOIN)
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: JoinConversationDto,
  ) {
    const user = this.socketAuth.getSocketUser(socket);
    await this.chatService.assertParticipant(dto.conversationId, user.id);
    await socket.join(conversationRoomId(dto.conversationId));
    return { event: CHAT_SERVER_EVENTS.JOINED, data: { conversationId: dto.conversationId } };
  }

  @SubscribeMessage(CHAT_CLIENT_EVENTS.SEND)
  async handleSend(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: SendMessageSocketDto,
  ) {
    const user = this.socketAuth.getSocketUser(socket);
    await this.rateLimit.assertWithinLimit(user.id, 'send', 60, 60_000);

    const message = await this.chatService.sendMessage(user, dto);
    const room = conversationRoomId(dto.conversationId);
    const conversation = await this.chatService.assertParticipant(
      dto.conversationId,
      user.id,
    );
    const recipientId =
      conversation.buyerId === user.id ? conversation.sellerId : conversation.buyerId;

    this.server.to(room).emit(CHAT_SERVER_EVENTS.NEW_MESSAGE, { message });
    this.server
      .to(this.userRoom(recipientId))
      .emit(CHAT_SERVER_EVENTS.NEW_MESSAGE, { message });

    return { success: true, message };
  }

  @SubscribeMessage(CHAT_CLIENT_EVENTS.TYPING)
  async handleTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: TypingEventDto,
  ) {
    const user = this.socketAuth.getSocketUser(socket);
    await this.rateLimit.assertWithinLimit(user.id, 'typing', 120, 60_000);
    await this.chatService.assertParticipant(dto.conversationId, user.id);

    const room = conversationRoomId(dto.conversationId);

    if (dto.isTyping) {
      await this.presenceService.setTyping(dto.conversationId, user.id);
    } else {
      await this.presenceService.clearTyping(dto.conversationId, user.id);
    }

    socket.to(room).emit(CHAT_SERVER_EVENTS.USER_TYPING, {
      conversationId: dto.conversationId,
      userId: user.id,
      displayName: user.displayName,
      isTyping: dto.isTyping,
    });

    return { success: true };
  }

  @SubscribeMessage(CHAT_CLIENT_EVENTS.READ)
  async handleRead(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: ReadReceiptDto,
  ) {
    const user = this.socketAuth.getSocketUser(socket);
    const result = await this.chatService.markRead(user, dto);
    const room = conversationRoomId(dto.conversationId);

    this.server.to(room).emit(CHAT_SERVER_EVENTS.MESSAGE_READ, {
      conversationId: dto.conversationId,
      readerId: user.id,
      markedCount: result.markedCount,
      messageIds: dto.messageIds,
    });

    return result;
  }

  @SubscribeMessage('admin:join_chats')
  async handleAdminJoin(@ConnectedSocket() socket: Socket) {
    this.socketAuth.getSocketUser(socket);
    await socket.join('admin:chats');
    return { success: true, room: 'admin:chats' };
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }
}
