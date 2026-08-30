import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class ModerationActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  readonly reason?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly reasons?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  readonly note?: string;
}
