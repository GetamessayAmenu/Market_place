import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class ReadReceiptDto {
  @IsUUID()
  conversationId!: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  messageIds?: string[];
}
