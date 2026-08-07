import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ConditionLogType {
  PRE_HANDOVER = 'PRE_HANDOVER',
  POST_RETURN = 'POST_RETURN',
}

export class CreateConditionLogDto {
  @IsEnum(ConditionLogType)
  type!: ConditionLogType;

  @IsArray()
  @IsString({ each: true })
  photoUrls!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
