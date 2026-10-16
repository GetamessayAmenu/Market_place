import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateSettingDto {
  @IsNotEmpty()
  value!: any;
}

export class UpdateFeatureFlagDto {
  @IsBoolean()
  enabled!: boolean;
}

export class SettingsQueryDto {
  @IsOptional()
  @IsString()
  group?: string;

  @IsOptional()
  @IsString()
  category?: string;
}
