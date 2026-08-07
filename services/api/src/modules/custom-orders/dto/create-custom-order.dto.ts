import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class MeasurementsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(300)
  chest?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(300)
  waist?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(300)
  hips?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(200)
  shoulder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(200)
  sleeve?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(300)
  length?: number;

  @IsOptional()
  @IsIn(['cm', 'in'])
  unit?: 'cm' | 'in';
}

export class CreateCustomOrderDto {
  @IsUUID()
  listingId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  selectedSize?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MeasurementsDto)
  measurements?: MeasurementsDto;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  selectedFabric?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  selectedColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  embroideryNotes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  inspirationImages?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  buyerNotes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99_999_999.99)
  agreedPrice?: number;
}
