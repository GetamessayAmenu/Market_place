import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GrantVerifiedDesignerDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class RevokeVerifiedDesignerDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
