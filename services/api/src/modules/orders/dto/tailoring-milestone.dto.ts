import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum TailoringMilestone {
  MEASUREMENTS_CONFIRMED = 'MEASUREMENTS_CONFIRMED',
  FABRIC_SELECTED_CUT = 'FABRIC_SELECTED_CUT',
  TAILORING_IN_PROGRESS = 'TAILORING_IN_PROGRESS',
  READY_FOR_FITTING = 'READY_FOR_FITTING',
}

export class UpdateTailoringMilestoneDto {
  @IsEnum(TailoringMilestone)
  milestone!: TailoringMilestone;

  @IsOptional()
  @IsString()
  notes?: string;
}
