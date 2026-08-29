import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, IsArray } from 'class-validator';

export class UpdateHomepageSectionDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitle?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  itemCount?: number;

  @IsOptional()
  @IsString()
  contentSource?: 'automatic' | 'manual';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  manualItemIds?: string[];
}
