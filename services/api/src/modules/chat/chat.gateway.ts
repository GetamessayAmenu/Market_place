import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ChatSafetyService } from './chat.safety.service';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Active user socket map (userId -> Set of socketIds)
  private readonly userSockets = new Map<string, Set<string>>();
  // Online presence timestamp map (userId -> Date)
  private readonly onlineUsers = new Map<string, Date>();

  constructor(
    private readonly chatService: ChatService,
    private readonly chatSafetyService: ChatSafetyService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user: AuthenticatedUser = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        permissions: [],
        status: 'active',
        sessionId: client.id,
      };

      client.data.user = user;

      // Track socket
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)!.add(client.id);
      this.onlineUsers.set(user.id, new Date());

      // Join user room
      client.join(`user:${user.id}`);

      // Broadcast online status to global room or queryable
      this.server.emit('chat:presence_update', {
        userId: user.id,
        isOnline: true,
        lastSeen: new Date().toISOString(),
      });
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as AuthenticatedUser;
    if (user) {
      const sockets = this.userSockets.get(user.id);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(user.id);
          this.onlineUsers.set(user.id, new Date());
          
          this.server.emit('chat:presence_update', {
            userId: user.id,
            isOnline: false,
            lastSeen: new Date().toISOString(),
          });
        }
      }
    }
  }

  // ─── Socket Event Handlers ───────────────────────────────────────────────────

  @SubscribeMessage('chat:join')
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    const user = client.data.user as AuthenticatedUser;
    if (!user || !data?.conversationId) return;

    try {
      await this.chatService.getConversation(data.conversationId, user);
      client.join(`conversation:${data.conversationId}`);
      client.emit('chat:joined', { conversationId: data.conversationId });
    } catch (error: any) {
      client.emit('chat:error', { message: error.message || 'Failed to join conversation' });
    }
  }

  @SubscribeMessage('chat:leave')
  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    if (!data?.conversationId) return;
    client.leave(`conversation:${data.conversationId}`);
    client.emit('chat:left', { conversationId: data.conversationId });
  }

  @SubscribeMessage('chat:send')
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      conversationId: string;
      content: string;
      messageType?: any;
      attachments?: any;
      replyToId?: string;
    }
  ) {
    const user = client.data.user as AuthenticatedUser;
    if (!user || !data?.conversationId) return;

    try {
      const payload: { content: string; messageType?: any; attachments?: any; replyToId?: string } = {
        content: data.content,
      };
      if (data.messageType) payload.messageType = data.messageType;
      if (data.attachments) payload.attachments = data.attachments;
      if (data.replyToId) payload.replyToId = data.replyToId;

      const message = await this.chatService.sendMessage(data.conversationId, user, payload);

      // Safety scan
      await this.chatSafetyService.scanMessage(message.id, data.conversationId, data.content || '');

      // Broadcast to room
      this.server.to(`conversation:${data.conversationId}`).emit('chat:new_message', message);
      this.server.to(`conversation:${data.conversationId}`).emit('new_message', message);
      client.emit('chat:sent_ack', message);
    } catch (error: any) {
      client.emit('chat:error', { message: error.message || 'Failed to send message' });
    }
  }

  @SubscribeMessage('chat:read')
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    const user = client.data.user as AuthenticatedUser;
    if (!user || !data?.conversationId) return;

    try {
      await this.chatService.markAsRead(data.conversationId, user);
      this.server.to(`conversation:${data.conversationId}`).emit('chat:message_read', {
        conversationId: data.conversationId,
        readBy: user.id,
        readAt: new Date().toISOString(),
      });
    } catch (error: any) {
      client.emit('chat:error', { message: error.message || 'Failed to mark messages as read' });
    }
  }

  @SubscribeMessage('chat:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean }
  ) {
    const user = client.data.user as AuthenticatedUser;
    if (!user || !data?.conversationId) return;

    client.to(`conversation:${data.conversationId}`).emit('chat:user_typing', {
      conversationId: data.conversationId,
      userId: user.id,
      isTyping: data.isTyping,
    });
    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId: user.id,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    this.handleTyping(client, { conversationId: data.conversationId, isTyping: true });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    this.handleTyping(client, { conversationId: data.conversationId, isTyping: false });
  }

  @SubscribeMessage('chat:edit')
  async handleEditMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; content: string }
  ) {
    const user = client.data.user as AuthenticatedUser;
    if (!user || !data?.messageId) return;

    try {
      const updated = await this.chatService.editMessage(data.messageId, user, data.content);
      this.server.to(`conversation:${updated.conversationId}`).emit('chat:message_edited', updated);
    } catch (error: any) {
      client.emit('chat:error', { message: error.message || 'Failed to edit message' });
    }
  }

  @SubscribeMessage('chat:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; conversationId: string }
  ) {
    const user = client.data.user as AuthenticatedUser;
    if (!user || !data?.messageId) return;

    try {
      await this.chatService.deleteMessage(data.messageId, user);
      this.server.to(`conversation:${data.conversationId}`).emit('chat:message_deleted', {
        messageId: data.messageId,
        conversationId: data.conversationId,
      });
    } catch (error: any) {
      client.emit('chat:error', { message: error.message || 'Failed to delete message' });
    }
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && (this.userSockets.get(userId)?.size || 0) > 0;
  }
}
