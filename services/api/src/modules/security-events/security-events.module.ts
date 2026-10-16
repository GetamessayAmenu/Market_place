import { Global, Module } from '@nestjs/common';
import { SecurityEventsService } from './security-events.service';
import { SecurityEventsController } from './security-events.controller';
import { AuthorizationModule } from '../authorization/authorization.module';

@Global()
@Module({
  imports: [AuthorizationModule],
  controllers: [SecurityEventsController],
  providers: [SecurityEventsService],
  exports: [SecurityEventsService],
})
export class SecurityEventsModule {}
