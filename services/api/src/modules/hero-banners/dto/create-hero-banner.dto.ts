import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateHeroBannerDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  titleAm?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  subtitleAm?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  cloudinaryPublicId?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsOptional()
  @IsString()
  holidayTheme?: string;

  @IsOptional()
  @IsString()
  themeStartDate?: string;

  @IsOptional()
  @IsString()
  themeEndDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  searchWeight?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;
}
