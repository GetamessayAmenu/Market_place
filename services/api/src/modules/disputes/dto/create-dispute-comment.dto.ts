import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateDisputeCommentDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
