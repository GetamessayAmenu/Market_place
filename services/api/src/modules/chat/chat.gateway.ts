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
import { eventEmitter } from '../users/users.service';

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

  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly chatSafetyService: ChatSafetyService,
    private readonly jwtService: JwtService,
  ) {
    // Listen for store follower updates and emit via Socket.IO
    eventEmitter.on('store_follower_updated', (data) => {
      this.server.to(`user:${data.storeId}`).emit('store_follower_updated', {
        followerCount: data.followerCount,
        isFollowing: data.isFollowing,
      });
    });
  }

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

      // Track user socket
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)!.add(client.id);

      // Join user's personal room for direct messages
      client.join(`user:${user.id}`);

      console.log(`User ${user.id} connected to chat`);
    } catch (error) {
      console.error('WebSocket connection error:', error);
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
        }
      }
      console.log(`User ${user.id} disconnected from chat`);
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    const user = client.data.user as AuthenticatedUser;
    if (!user) return;

    try {
      await this.chatService.getConversation(data.conversationId, user);
      client.join(`conversation:${data.conversationId}`);
      
      // Send success response
      client.emit('joined_conversation', { conversationId: data.conversationId });
    } catch (error) {
      client.emit('error', { message: 'Failed to join conversation' });
    }
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    client.leave(`conversation:${data.conversationId}`);
    client.emit('left_conversation', { conversationId: data.conversationId });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string; mediaUrls?: string[] }
  ) {
    const user = client.data.user as AuthenticatedUser;
    if (!user) return;

    try {
      const message = await this.chatService.sendMessage(
        data.conversationId,
        user,
        data.content
      );
      
      // Scan message for safety violations
      await this.chatSafetyService.scanMessage(message.id, data.conversationId, data.content);
      
      // Broadcast message to all users in the conversation
      this.server.to(`conversation:${data.conversationId}`).emit('new_message', message);
      
      // Also send to sender's personal room
      client.emit('message_sent', message);
    } catch (error) {
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('send_custom_quote')
  async handleSendCustomQuote(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; quote: { proposedPrice: number; proposedDeposit?: number; notes?: string } }
  ) {
    const user = client.data.user as AuthenticatedUser;
    if (!user) return;

    try {
      // Send quote as a structured message
      const quoteMessage = JSON.stringify({
        type: 'custom_quote',
        ...data.quote,
        senderId: user.id,
        senderName: user.email.split('@')[0],
      });

      const message = await this.chatService.sendMessage(
        data.conversationId,
        user,
        quoteMessage
      );

      // Broadcast to conversation
      this.server.to(`conversation:${data.conversationId}`).emit('new_message', message);
      this.server.to(`conversation:${data.conversationId}`).emit('custom_quote_sent', {
        conversationId: data.conversationId,
        quote: data.quote,
        messageId: message.id,
      });

      client.emit('quote_sent', message);
    } catch (error) {
      client.emit('error', { message: 'Failed to send quote' });
    }
  }

  @SubscribeMessage('accept_quote')
  async handleAcceptQuote(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; quoteId: string }
  ) {
    const user = client.data.user as AuthenticatedUser;
    if (!user) return;

    try {
      // Send acceptance message
      const acceptMessage = JSON.stringify({
        type: 'quote_accepted',
        quoteId: data.quoteId,
        senderId: user.id,
      });

      const message = await this.chatService.sendMessage(
        data.conversationId,
        user,
        acceptMessage
      );

      this.server.to(`conversation:${data.conversationId}`).emit('new_message', message);
      this.server.to(`conversation:${data.conversationId}`).emit('quote_accepted', {
        conversationId: data.conversationId,
        quoteId: data.quoteId,
      });

      client.emit('quote_accepted', message);
    } catch (error) {
      client.emit('error', { message: 'Failed to accept quote' });
    }
  }

  @SubscribeMessage('update_order_status')
  async handleUpdateOrderStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; orderId: string; status: string }
  ) {
    const user = client.data.user as AuthenticatedUser;
    if (!user) return;

    try {
      // This would typically call the orders service
      // For now, send a system message about the status update
      const statusMessage = JSON.stringify({
        type: 'system_status_update',
        orderId: data.orderId,
        status: data.status,
        senderId: user.id,
      });

      const message = await this.chatService.sendMessage(
        data.conversationId,
        user,
        statusMessage
      );

      this.server.to(`conversation:${data.conversationId}`).emit('new_message', message);
      this.server.to(`conversation:${data.conversationId}`).emit('order_status_updated', {
        conversationId: data.conversationId,
        orderId: data.orderId,
        status: data.status,
      });

      client.emit('order_status_updated', message);
    } catch (error) {
      client.emit('error', { message: 'Failed to update order status' });
    }
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    const user = client.data.user as AuthenticatedUser;
    if (!user) return;

    try {
      await this.chatService.markAsRead(data.conversationId, user);
      client.emit('marked_as_read', { conversationId: data.conversationId });
    } catch (error) {
      client.emit('error', { message: 'Failed to mark as read' });
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    const user = client.data.user as AuthenticatedUser;
    if (!user) return;

    // Broadcast typing indicator to conversation (excluding sender)
    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId: user.id,
    });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    const user = client.data.user as AuthenticatedUser;
    if (!user) return;

    client.to(`conversation:${data.conversationId}`).emit('user_stopped_typing', {
      conversationId: data.conversationId,
      userId: user.id,
    });
  }

  // Helper method to send notifications to specific users
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Helper method to broadcast to conversation
  sendToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }
}
