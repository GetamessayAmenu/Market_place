import { Module } from '@nestjs/common';
import { CallbackRequestsController } from './callback-requests.controller';
import { CallbackRequestsRepository } from './callback-requests.repository';
import { CallbackRequestsService } from './callback-requests.service';

@Module({
  controllers: [CallbackRequestsController],
  providers: [CallbackRequestsRepository, CallbackRequestsService],
  exports: [CallbackRequestsService],
})
export class CallbackRequestsModule {}
