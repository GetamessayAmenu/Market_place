import { Module } from '@nestjs/common';

import { ListingsModule } from '../listings/listings.module';

import { ReviewsController } from './reviews.controller';
import { ReviewsRepository } from './reviews.repository';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [ListingsModule],
  controllers: [ReviewsController],
  providers: [ReviewsRepository, ReviewsService],
  exports: [ReviewsService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ReviewsModule {}
