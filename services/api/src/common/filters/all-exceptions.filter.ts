import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ApiErrorResponse } from '@marketplace/types';
import type { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url?: string }>();

    const { status, code, message, details } = this.resolveException(exception);

    const body: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      timestamp: new Date().toISOString(),
      ...(request.url ? { path: request.url } : {}),
    };

    response.status(status).json(body);
  }

  private resolveException(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        return {
          status,
          code: HttpStatus[status] ?? 'HTTP_EXCEPTION',
          message: res,
        };
      }

      const payload = res as Record<string, unknown>;
      const messages = payload.message;
      const message = Array.isArray(messages)
        ? messages.join('; ')
        : String(messages ?? exception.message);

      const result: {
        status: number;
        code: string;
        message: string;
        details?: Record<string, unknown>;
      } = {
        status,
        code: String(payload.error ?? HttpStatus[status] ?? 'HTTP_EXCEPTION'),
        message,
      };

      if (typeof payload === 'object' && !Array.isArray(payload)) {
        result.details = payload as Record<string, unknown>;
      }

      return result;
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    };
  }
}
