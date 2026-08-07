import { IsString, IsUUID, IsNotEmpty, IsOptional, IsObject, IsEnum, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from './order-type.enum';

export class CreateOrderDto {
  @IsEnum(OrderType)
  @IsNotEmpty()
  type!: OrderType;

  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @IsNumber()
  @IsNotEmpty()
  agreedPrice!: number;

  @IsOptional()
  @IsNumber()
  agreedDeposit?: number;

  @IsOptional()
  @IsObject()
  shippingAddress?: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    notes?: string;
  };

  // Rental-specific fields
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  rentalStartDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  rentalEndDate?: Date;

  // Custom tailoring-specific fields
  @IsOptional()
  @IsObject()
  customMeasurements?: any;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fittingDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}
