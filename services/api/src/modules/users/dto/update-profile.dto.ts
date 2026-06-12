import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  readonly phone?: string;
}
