import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveReportDto {
  @IsEnum(['resolved', 'dismissed'] as const)
  resolution!: 'resolved' | 'dismissed';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNote?: string;
}

export class UpdateReportStatusDto {
  @IsEnum(['pending', 'under_review', 'investigating', 'resolved', 'dismissed', 'closed'] as const)
  status!: 'pending' | 'under_review' | 'investigating' | 'resolved' | 'dismissed' | 'closed';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
