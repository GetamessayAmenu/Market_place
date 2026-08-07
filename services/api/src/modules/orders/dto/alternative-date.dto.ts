import { IsArray, IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AlternativeDateSuggestionDto {
  @IsArray()
  @IsDate({ each: true })
  @Type(() => Date)
  alternativeDates!: Date[];

  @IsOptional()
  @IsString()
  notes?: string;
}
