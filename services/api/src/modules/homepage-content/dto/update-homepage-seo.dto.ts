import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateHomepageSeoDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  ogImageUrl?: string;

  @IsOptional()
  @IsString()
  ogImageCloudinaryId?: string;
}
