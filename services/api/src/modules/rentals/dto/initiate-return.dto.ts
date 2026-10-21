import { IsOptional, IsString, MaxLength } from 'class-validator';

export class InitiateReturnDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  returnCondition?: string;
}
