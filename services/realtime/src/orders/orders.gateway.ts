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
import { Logger } from '@nestjs/common';
import { 
  ORDER_CLIENT_EVENTS, 
  ORDER_SERVER_EVENTS,
  conversationRoomId,
  userRoom 
} from '../events.constants';
import { ChatService } from '../chat/chat.service';
import { SocketUser } from '../websocket/interfaces/socket-user.interface';

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

@WebSocketGateway({
  namespace: '/orders',
  cors: { origin: '*' },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    const socket = client as AuthenticatedSocket;
    const userId = socket.user?.id;

    if (!userId) {
      this.logger.warn(`Unauthorized connection attempt: ${client.id}`);
      client.disconnect();
      return;
    }

    this.logger.log(`User ${userId} connected to orders gateway: ${client.id}`);
    
    // Join user's personal room for direct notifications
    client.join(userRoom(userId));
  }

  async handleDisconnect(client: Socket) {
    const socket = client as AuthenticatedSocket;
    const userId = socket.user?.id;
    this.logger.log(`User ${userId} disconnected from orders gateway: ${client.id}`);
  }

  @SubscribeMessage(ORDER_CLIENT_EVENTS.JOIN_ORDER_CHAT)
  async joinOrderChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string }
  ) {
    const userId = client.user?.id;
    if (!userId) {
      client.emit(ORDER_SERVER_EVENTS.ORDER_ERROR, { message: 'Unauthorized' });
      return;
    }

    try {
      // Verify user has access to this order
      const order = await this.chatService.verifyOrderAccess(data.orderId, userId);
      if (!order) {
        client.emit(ORDER_SERVER_EVENTS.ORDER_ERROR, { message: 'Order not found or access denied' });
        return;
      }

      // Join the conversation room
      const conversationId = order.conversation?.id || (order as any).conversationId || (order as any).conversation_id;
      const room = conversationRoomId(conversationId);
      client.join(room);

      client.emit(ORDER_SERVER_EVENTS.ORDER_JOINED, { 
        orderId: data.orderId,
        conversationId
      });

      this.logger.log(`User ${userId} joined order chat: ${data.orderId}`);
    } catch (error) {
      this.logger.error(`Error joining order chat: ${error instanceof Error ? error.message : String(error)}`);
      client.emit(ORDER_SERVER_EVENTS.ORDER_ERROR, { message: 'Failed to join order chat' });
    }
  }

  @SubscribeMessage(ORDER_CLIENT_EVENTS.LEAVE_ORDER_CHAT)
  async leaveOrderChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string }
  ) {
    const userId = client.user?.id;
    if (!userId) return;

    try {
      const order = await this.chatService.verifyOrderAccess(data.orderId, userId);
      if (order) {
        const conversationId = order.conversation?.id || (order as any).conversationId || (order as any).conversation_id;
        const room = conversationRoomId(conversationId);
        client.leave(room);
        this.logger.log(`User ${userId} left order chat: ${data.orderId}`);
      }
    } catch (error) {
      this.logger.error(`Error leaving order chat: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  @SubscribeMessage(ORDER_CLIENT_EVENTS.SEND_ORDER_MESSAGE)
  async sendOrderMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string; message: string }
  ) {
    const userId = client.user?.id;
    if (!userId) {
      client.emit(ORDER_SERVER_EVENTS.ORDER_ERROR, { message: 'Unauthorized' });
      return;
    }

    try {
      const order = await this.chatService.verifyOrderAccess(data.orderId, userId);
      if (!order) {
        client.emit(ORDER_SERVER_EVENTS.ORDER_ERROR, { message: 'Order not found or access denied' });
        return;
      }

      // Send message through the chat service
      const conversationId = order.conversation?.id || (order as any).conversationId || (order as any).conversation_id;
      const message = await this.chatService.sendMessageSimple({
        conversationId,
        senderId: userId,
        body: data.message,
      });

      // Broadcast to the conversation room
      const room = conversationRoomId(conversationId);
      this.server.to(room).emit(ORDER_SERVER_EVENTS.ORDER_MESSAGE, {
        orderId: data.orderId,
        message,
      });

      // Also notify through the regular chat gateway
      this.server.to(room).emit('chat:new_message', message);

      this.logger.log(`Message sent in order chat ${data.orderId} by user ${userId}`);
    } catch (error) {
      this.logger.error(`Error sending order message: ${error instanceof Error ? error.message : String(error)}`);
      client.emit(ORDER_SERVER_EVENTS.ORDER_ERROR, { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage(ORDER_CLIENT_EVENTS.REQUEST_QUOTE)
  async requestQuote(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string; details?: any }
  ) {
    const userId = client.user?.id;
    if (!userId) {
      client.emit(ORDER_SERVER_EVENTS.ORDER_ERROR, { message: 'Unauthorized' });
      return;
    }

    try {
      const order = await this.chatService.verifyOrderAccess(data.orderId, userId);
      if (!order || order.buyerId !== userId) {
        client.emit(ORDER_SERVER_EVENTS.ORDER_ERROR, { message: 'Only buyers can request quotes' });
        return;
      }

      // Notify seller about quote request
      const sellerRoom = userRoom(order.sellerId);
      this.server.to(sellerRoom).emit(ORDER_SERVER_EVENTS.QUOTE_RECEIVED, {
        orderId: data.orderId,
        buyerId: userId,
        details: data.details,
      });

      this.logger.log(`Quote requested for order ${data.orderId} by buyer ${userId}`);
    } catch (error) {
      this.logger.error(`Error requesting quote: ${error instanceof Error ? error.message : String(error)}`);
      client.emit(ORDER_SERVER_EVENTS.ORDER_ERROR, { message: 'Failed to request quote' });
    }
  }

  @SubscribeMessage(ORDER_CLIENT_EVENTS.ACCEPT_QUOTE)
  async acceptQuote(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string; quoteId: string }
  ) {
    const userId = client.user?.id;
    if (!userId) {
      client.emit(ORDER_SERVER_EVENTS.ORDER_ERROR, { message: 'Unauthorized' });
      return;
    }

    try {
      const order = await this.chatService.verifyOrderAccess(data.orderId, userId);
      if (!order || order.buyerId !== userId) {
        client.emit(ORDER_SERVER_EVENTS.ORDER_ERROR, { message: 'Only buyers can accept quotes' });
        return;
      }

      // Notify seller about quote acceptance
      const sellerRoom = userRoom(order.sellerId);
      this.server.to(sellerRoom).emit(ORDER_SERVER_EVENTS.QUOTE_ACCEPTED, {
        orderId: data.orderId,
        quoteId: data.quoteId,
        buyerId: userId,
      });

      // Broadcast to conversation room
      const room = conversationRoomId(order.conversationId);
      this.server.to(room).emit(ORDER_SERVER_EVENTS.QUOTE_ACCEPTED, {
        orderId: data.orderId,
        quoteId: data.quoteId,
      });

      this.logger.log(`Quote ${data.quoteId} accepted for order ${data.orderId} by buyer ${userId}`);
    } catch (error) {
      this.logger.error(`Error accepting quote: ${error instanceof Error ? error.message : String(error)}`);
      client.emit(ORDER_SERVER_EVENTS.ORDER_ERROR, { message: 'Failed to accept quote' });
    }
  }

  @SubscribeMessage(ORDER_CLIENT_EVENTS.UPDATE_STATUS)
  async updateOrderStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string; status: string; notes?: string }
  ) {
    const userId = client.user?.id;
    if (!userId) {
      client.emit(ORDER_SERVER_EVENTS.ORDER_ERROR, { message: 'Unauthorized' });
      return;
    }

    try {
      const order = await this.chatService.verifyOrderAccess(data.orderId, userId);
      if (!order) {
        client.emit(ORDER_SERVER_EVENTS.ORDER_ERROR, { message: 'Order not found or access denied' });
        return;
      }

      // Broadcast status update to conversation room
      const conversationId = order.conversation?.id || (order as any).conversationId || (order as any).conversation_id;
      const room = conversationRoomId(conversationId);
      this.server.to(room).emit(ORDER_SERVER_EVENTS.STATUS_UPDATED, {
        orderId: data.orderId,
        status: data.status,
        notes: data.notes,
        updatedBy: userId,
      });

      // Also notify the other party directly
      const recipientId = order.buyerId === userId ? order.sellerId : order.buyerId;
      const recipientRoom = userRoom(recipientId);
      this.server.to(recipientRoom).emit(ORDER_SERVER_EVENTS.STATUS_UPDATED, {
        orderId: data.orderId,
        status: data.status,
        notes: data.notes,
        updatedBy: userId,
      });

      this.logger.log(`Order ${data.orderId} status updated to ${data.status} by user ${userId}`);
    } catch (error) {
      this.logger.error(`Error updating order status: ${error instanceof Error ? error.message : String(error)}`);
      client.emit(ORDER_SERVER_EVENTS.ORDER_ERROR, { message: 'Failed to update status' });
    }
  }

  // Helper method to broadcast order updates (can be called from other services)
  broadcastOrderUpdate(orderId: string, update: any) {
    this.server.emit(ORDER_SERVER_EVENTS.STATUS_UPDATED, {
      orderId,
      ...update,
    });
  }
}
