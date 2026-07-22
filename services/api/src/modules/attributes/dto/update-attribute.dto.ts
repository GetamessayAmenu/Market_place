import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { AttributeType } from './create-attribute.dto';

export class UpdateAttributeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(AttributeType)
  type?: AttributeType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
