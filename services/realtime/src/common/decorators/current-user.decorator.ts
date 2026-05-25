import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { SocketUser } from '../../websocket/interfaces/socket-user.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SocketUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: SocketUser }>();
    return request.user;
  },
);
