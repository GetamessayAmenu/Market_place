import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  chat?: boolean;

  @IsOptional()
  @IsBoolean()
  listing?: boolean;

  @IsOptional()
  @IsBoolean()
  order?: boolean;

  @IsOptional()
  @IsBoolean()
  rental?: boolean;

  @IsOptional()
  @IsBoolean()
  customOrder?: boolean;

  @IsOptional()
  @IsBoolean()
  promotional?: boolean;
}
