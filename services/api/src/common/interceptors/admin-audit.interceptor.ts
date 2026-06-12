import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AdminLogsService } from '../../modules/admin-logs/admin-logs.service';

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector, private readonly logs: AdminLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Only audit when the route requires admin-like roles or permissions
    if ((!requiredRoles || !requiredRoles.length) && !requiredPermissions) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    return next.handle().pipe(
      tap(async () => {
        try {
          if (!user) return;
          // only log for admin/support/moderator roles OR when permissions are required
          const adminRoles = ['admin', 'super_admin', 'moderator', 'customer_support'];
          const isAdminRole = requiredRoles && adminRoles.some((r) => requiredRoles.includes(r));
          if (!isAdminRole && !requiredPermissions) return;

          const actorId = user.id as string;
          const action = `${req.method} ${req.route?.path ?? req.path}`;
          const resource = req.baseUrl ?? req.path;
          const resourceId = req.params?.id ?? null;
          const ip = req.ip ?? null;
          const ua = req.get?.('user-agent') ?? null;

          await this.logs.createLog({
            actorId,
            action,
            resource,
            resourceId,
            metadata: { params: req.params, query: req.query },
            ipAddress: ip,
            userAgent: ua,
          });
        } catch (e) {
          // swallow logging errors
        }
      }),
    );
  }
}
