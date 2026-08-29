import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveDisputeDto {
  @IsString()
  @MaxLength(50)
  resolutionOutcome!: string; // BUYER_SUPPORTED, SELLER_SUPPORTED, MUTUAL_AGREEMENT, POLICY_VIOLATION, NO_VIOLATION, INSUFFICIENT_EVIDENCE, ESCALATED_EXTERNALLY

  @IsString()
  @MaxLength(2000)
  resolutionReason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  resolutionAction?: string;
}

export class EscalateDisputeDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class RequestInfoDisputeDto {
  @IsString()
  targetUser!: 'reporter' | 'respondent' | 'both';

  @IsString()
  @MaxLength(2000)
  message!: string;
}

export class AssignDisputeDto {
  @IsOptional()
  @IsString()
  assignedAdminId?: string | null;
}

export class ReopenDisputeDto {
  @IsString()
  @MaxLength(1000)
  reason!: string;
}
