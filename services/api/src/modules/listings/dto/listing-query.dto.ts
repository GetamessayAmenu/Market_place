import { IsIn, IsOptional, IsString } from 'class-validator';

import { ListingFilterDto } from './listing-filter.dto';

export class ListingQueryDto extends ListingFilterDto {
  @IsOptional()
  @IsIn(['newest', 'oldest', 'price_asc', 'price_desc'])
  sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' = 'newest';

  @IsOptional()
  @IsString()
  search?: string;
}
