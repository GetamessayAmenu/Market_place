import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const CUSTOM_ORDER_STATUSES = [
  'submitted',
  'under_review',
  'confirmed',
  'in_production',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type CustomOrderStatus = (typeof CUSTOM_ORDER_STATUSES)[number];

export class UpdateCustomOrderStatusDto {
  @IsIn([...CUSTOM_ORDER_STATUSES])
  status!: CustomOrderStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999.99)
  agreedPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelledReason?: string;
}
