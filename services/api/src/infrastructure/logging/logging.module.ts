import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

import { ApiConfigService } from '../config/api-config.service';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ApiConfigService],
      useFactory: (config: ApiConfigService) => {
        const pinoHttp: Record<string, unknown> = {
          level: config.isProduction ? 'info' : 'debug',
          autoLogging: true,
          redact: ['req.headers.authorization', 'req.headers.cookie'],
        };

        if (!config.isProduction) {
          pinoHttp.transport = {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
            },
          };
        }

        return { pinoHttp };
      },
    }),
  ],
})
export class LoggingModule {}
