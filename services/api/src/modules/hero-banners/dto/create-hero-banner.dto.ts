import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateHeroBannerDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  titleAm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  subtitleAm?: string;

  @IsString()
  @MaxLength(500)
  imageUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  cloudinaryPublicId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkUrl?: string;

  @IsOptional()
  @IsEnum(['MESKEL', 'TIMKET', 'ENKUTATASH', 'TLEK_SERG', 'FASIKA'])
  holidayTheme?: 'MESKEL' | 'TIMKET' | 'ENKUTATASH' | 'TLEK_SERG' | 'FASIKA';

  @IsOptional()
  themeStartDate?: string;

  @IsOptional()
  themeEndDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  searchWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
