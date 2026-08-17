import { Module } from '@nestjs/common';
import { AdminChatsService } from './admin-chats.service';
import { AdminChatsController } from './admin-chats.controller';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Module({
  controllers: [AdminChatsController],
  providers: [AdminChatsService, PrismaService],
  exports: [AdminChatsService],
})
export class AdminChatsModule {}
