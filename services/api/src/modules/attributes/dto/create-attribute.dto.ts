import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum AttributeType {
  size = 'size',
  color = 'color',
  material = 'material',
  brand = 'brand',
  custom = 'custom',
}

export class CreateAttributeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsEnum(AttributeType)
  type!: AttributeType;

  @IsArray()
  @IsString({ each: true })
  values!: string[];

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
