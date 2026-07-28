import { Module } from '@nestjs/common';

import { HeroBannersController } from './hero-banners.controller';
import { HeroBannersService } from './hero-banners.service';
import { HeroBannersRepository } from './hero-banners.repository';
import { AdminLogsModule } from '../admin-logs/admin-logs.module';

@Module({
  imports: [AdminLogsModule],
  controllers: [HeroBannersController],
  providers: [HeroBannersService, HeroBannersRepository],
  exports: [HeroBannersService],
})
export class HeroBannersModule {}
