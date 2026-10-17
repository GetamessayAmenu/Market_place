import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  PERMISSIONS_KEY,
  type PermissionRequirement,
} from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { RequestWithUser } from '../interfaces/request-with-user.interface';
import { AuthorizationService } from '../../modules/authorization/authorization.service';
import { SecurityEventsService } from '../../modules/security-events/security-events.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
    @Optional() private readonly securityEventsService?: SecurityEventsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<PermissionRequirement[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const hasAll = this.authorizationService.canAll(user, required);

    if (!hasAll) {
      // Record permission denied security audit event
      if (this.securityEventsService) {
        this.securityEventsService.recordEvent({
          eventType: 'PERMISSION_DENIED',
          severity: 'WARNING',
          actorId: user.id,
          ipAddress: request.ip,
          userAgent: request.get('user-agent'),
          details: {
            requiredPermissions: required,
            endpoint: request.originalUrl || request.url,
            method: request.method,
            userRole: user.role,
          },
          status: 'FAILURE',
        });
      }

      throw new ForbiddenException('Missing required seller permission to create or manage listings');
    }

    return true;
  }
}

