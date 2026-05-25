import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ApiErrorResponse } from '@marketplace/types';
import type { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url?: string }>();

    const { status, code, message } = this.mapPrismaError(exception);

    const body: ApiErrorResponse = {
      success: false,
      error: { code, message },
      timestamp: new Date().toISOString(),
      ...(request.url ? { path: request.url } : {}),
    };

    response.status(status).json(body);
  }

  private mapPrismaError(
    exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError,
  ): { status: number; code: string; message: string } {
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'PRISMA_VALIDATION_ERROR',
        message: 'Invalid database query',
      };
    }

    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          code: 'UNIQUE_CONSTRAINT',
          message: 'Resource already exists',
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'Resource not found',
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          code: `PRISMA_${exception.code}`,
          message: 'Database operation failed',
        };
    }
  }
}
