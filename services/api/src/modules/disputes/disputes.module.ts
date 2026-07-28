import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminLogsModule } from '../admin-logs/admin-logs.module';
import { DisputesController } from './disputes.controller';
import { DisputesRepository } from './disputes.repository';
import { DisputesService } from './disputes.service';

@Module({
  controllers: [DisputesController],
  providers: [DisputesService, DisputesRepository, PrismaService],
  imports: [AdminLogsModule],
  exports: [DisputesService, DisputesRepository],
})
export class DisputesModule {}
