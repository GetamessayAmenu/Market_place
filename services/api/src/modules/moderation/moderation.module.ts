import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AdminLogsModule } from '../admin-logs/admin-logs.module';
import { UploadsModule } from '../uploads/uploads.module';

import { ModerationController } from './moderation.controller';
import { ModerationRepository } from './moderation.repository';
import { ModerationService } from './moderation.service';

@Module({
  imports: [AdminLogsModule, UploadsModule, EventEmitterModule.forRoot()],
  controllers: [ModerationController],
  providers: [ModerationService, ModerationRepository],
  exports: [ModerationService],
})
export class ModerationModule {}
