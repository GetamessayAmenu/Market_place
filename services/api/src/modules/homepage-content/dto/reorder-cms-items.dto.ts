import { IsArray, IsString } from 'class-validator';

export class ReorderCmsItemsDto {
  @IsArray()
  @IsString({ each: true })
  itemIds!: string[];
}
