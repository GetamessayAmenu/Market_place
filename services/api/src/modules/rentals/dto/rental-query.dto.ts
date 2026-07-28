import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class RentalQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(['REQUESTED', 'APPROVED', 'HANDOVER_PENDING', 'ACTIVE', 'RETURN_INITIATED', 'RETURNED_INSPECTED', 'COMPLETED', 'DISPUTED'])
  status?: 'REQUESTED' | 'APPROVED' | 'HANDOVER_PENDING' | 'ACTIVE' | 'RETURN_INITIATED' | 'RETURNED_INSPECTED' | 'COMPLETED' | 'DISPUTED';

  @IsOptional()
  @IsString()
  listingId?: string;

  @IsOptional()
  @IsString()
  renterId?: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @IsOptional()
  @IsDateString()
  endDateFrom?: string;

  @IsOptional()
  @IsDateString()
  endDateTo?: string;
}
