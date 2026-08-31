import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

loadEnv({ path: resolve(__dirname, '../.env') });

import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { ApiConfigService } from './infrastructure/config/api-config.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const config = app.get(ApiConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableCors({
    origin: [...config.corsOrigins],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter(), new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  const port = config.port;
  await app.listen(port);
  logger.log(`API listening on port ${port} (${config.nodeEnv})`);
}

void bootstrap();
