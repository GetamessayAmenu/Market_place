import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CallbackRequestsService } from './callback-requests.service';
import { CreateCallbackRequestDto } from './dto/create-callback-request.dto';

@Controller('callback-requests')
export class CallbackRequestsController {
  constructor(private readonly service: CallbackRequestsService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateCallbackRequestDto) {
    return this.service.create(dto);
  }
}
