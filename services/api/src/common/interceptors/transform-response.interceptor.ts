import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { ApiSuccessResponse } from '@marketplace/types';
import { map, type Observable } from 'rxjs';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<unknown>> {
    return next.handle().pipe(
      map(
        (data): ApiSuccessResponse<unknown> => ({
          success: true,
          data,
        }),
      ),
    );
  }
}
