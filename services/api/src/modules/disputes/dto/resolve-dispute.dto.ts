import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveDisputeDto {
  @IsString()
  @MaxLength(2000)
  resolutionNote!: string;

  @IsString()
  @MaxLength(100)
  resolutionAction!: string;
}

export class EscalateDisputeDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
