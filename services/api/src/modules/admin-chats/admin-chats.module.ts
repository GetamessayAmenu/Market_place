import { Module } from '@nestjs/common';
import { AdminChatsService } from './admin-chats.service';
import { AdminChatsController } from './admin-chats.controller';
import { MessagingRestrictionsService } from './messaging-restrictions.service';
import { RiskSignalService } from './risk-signal.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminLogsModule } from '../admin-logs/admin-logs.module';

@Module({
  imports: [AdminLogsModule],
  controllers: [AdminChatsController],
  providers: [
    AdminChatsService,
    MessagingRestrictionsService,
    RiskSignalService,
    PrismaService,
  ],
  exports: [AdminChatsService, MessagingRestrictionsService, RiskSignalService],
})
export class AdminChatsModule {}
