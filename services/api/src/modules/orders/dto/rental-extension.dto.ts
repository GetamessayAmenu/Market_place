import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RequestExtensionDto {
  @IsInt()
  @Min(1)
  extensionDays!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class RespondExtensionDto {
  @IsBoolean()
  approved!: boolean;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsNumber()
  additionalCharge?: number;
}
