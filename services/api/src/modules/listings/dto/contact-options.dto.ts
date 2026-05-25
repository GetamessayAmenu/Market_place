import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ContactOptionsDto {
  @IsOptional()
  @IsBoolean()
  showPhone?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  telegram?: string;

  @IsOptional()
  @IsBoolean()
  inAppMessaging?: boolean;
}
