import { Module } from '@nestjs/common';

import { AdminLogsModule } from '../admin-logs/admin-logs.module';
import { AttributesController } from './attributes.controller';
import { AttributesRepository } from './attributes.repository';
import { AttributesService } from './attributes.service';

@Module({
  imports: [AdminLogsModule],
  controllers: [AttributesController],
  providers: [AttributesService, AttributesRepository],
  exports: [AttributesService],
})
export class AttributesModule {}
