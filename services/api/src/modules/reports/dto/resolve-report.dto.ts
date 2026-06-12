import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveReportDto {
  @IsEnum(['resolved', 'dismissed'] as const)
  resolution!: 'resolved' | 'dismissed';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNote?: string;
}
