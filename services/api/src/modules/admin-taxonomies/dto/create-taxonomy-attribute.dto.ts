import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum AttributeType {
  size = 'size',
  color = 'color',
  material = 'material',
  brand = 'brand',
  custom = 'custom',
  weaving_pattern = 'weaving_pattern',
  fabric_type = 'fabric_type',
  embroidery_style = 'embroidery_style',
}

export class CreateTaxonomyAttributeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nameAm?: string;

  @IsEnum(AttributeType)
  type!: AttributeType;

  @IsArray()
  values!: { value: string; valueAm?: string }[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descriptionAm?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
