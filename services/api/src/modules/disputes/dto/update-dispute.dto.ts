import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateDisputeDto {
  @IsOptional()
  @IsEnum(['open', 'in_progress', 'awaiting_response', 'under_review', 'waiting_for_info', 'waiting_for_information', 'resolved', 'closed', 'escalated'] as const)
  status?: 'open' | 'in_progress' | 'awaiting_response' | 'under_review' | 'waiting_for_info' | 'waiting_for_information' | 'resolved' | 'closed' | 'escalated';

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'] as const)
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
