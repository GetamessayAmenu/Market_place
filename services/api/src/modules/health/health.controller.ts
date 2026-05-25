import { Controller, Get } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';
import type { HealthCheckResultDto } from './dto/health-check-result.dto';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  check(): Promise<HealthCheckResultDto> {
    return this.healthService.check();
  }
}
