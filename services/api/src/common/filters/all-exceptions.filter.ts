import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiErrorResponse } from '@marketplace/types';
import type { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url?: string; method?: string }>();

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `Unhandled Exception during ${request.method ?? ''} ${request.url ?? ''}: ${
          exception instanceof Error ? exception.message : String(exception)
        }`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

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
        code: String(payload.code ?? payload.error ?? HttpStatus[status] ?? 'HTTP_EXCEPTION'),
        message,
      };

      if (typeof payload === 'object' && !Array.isArray(payload)) {
        result.details = payload as Record<string, unknown>;
      }

      return result;
    }

    // Prisma error fallback handling
    if (exception && typeof exception === 'object' && 'code' in exception) {
      const prismaError = exception as { code: string; message: string };
      if (prismaError.code === 'P2002') {
        return {
          status: HttpStatus.CONFLICT,
          code: 'UNIQUE_CONSTRAINT',
          message: 'A conflicting record already exists.',
        };
      }
      if (prismaError.code === 'P2025') {
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'Resource not found.',
        };
      }
      if (prismaError.code === 'P2003') {
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Related resource not found or invalid reference.',
        };
      }
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const message =
      isDev && exception instanceof Error ? exception.message : 'An unexpected error occurred';

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message,
    };
  }
}
