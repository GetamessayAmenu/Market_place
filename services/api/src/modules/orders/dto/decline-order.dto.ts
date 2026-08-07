import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum DeclineReason {
  DATES_UNAVAILABLE = 'DATES_UNAVAILABLE',
  CUSTOM_SCHEDULE_FULL = 'CUSTOM_SCHEDULE_FULL',
  ITEM_OUT_OF_STOCK = 'ITEM_OUT_OF_STOCK',
  OTHER = 'OTHER',
}

export class DeclineOrderDto {
  @IsEnum(DeclineReason)
  reason!: DeclineReason;

  @IsOptional()
  @IsString()
  customReason?: string;
}
