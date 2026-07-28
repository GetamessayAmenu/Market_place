import { IsArray, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class ReorderHomepageContentDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  itemIds!: string[];
}
