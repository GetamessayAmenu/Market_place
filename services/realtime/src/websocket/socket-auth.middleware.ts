import { Injectable } from '@nestjs/common';
import type { Socket } from 'socket.io';

import { SocketAuthService } from './socket-auth.service';

/**
 * Socket.IO connection middleware — validates JWT + Redis session before connect.
 */
@Injectable()
export class SocketAuthMiddleware {
  constructor(private readonly socketAuth: SocketAuthService) {}

  use = async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
    try {
      await this.socketAuth.authenticateSocket(socket);
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error('Unauthorized'));
    }
  };
}
