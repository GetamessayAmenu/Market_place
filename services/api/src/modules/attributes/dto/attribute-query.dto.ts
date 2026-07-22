import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { AttributeType } from './create-attribute.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class AttributeQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AttributeType)
  type?: AttributeType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}
