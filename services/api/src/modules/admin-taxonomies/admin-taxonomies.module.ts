import { Module } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminLogsModule } from '../admin-logs/admin-logs.module';
import { AdminTaxonomiesController } from './admin-taxonomies.controller';
import { AdminTaxonomiesRepository } from './admin-taxonomies.repository';
import { AdminTaxonomiesService } from './admin-taxonomies.service';

@Module({
  controllers: [AdminTaxonomiesController],
  providers: [AdminTaxonomiesService, AdminTaxonomiesRepository, PrismaService],
  imports: [AdminLogsModule],
  exports: [AdminTaxonomiesService, AdminTaxonomiesRepository],
})
export class AdminTaxonomiesModule {}
