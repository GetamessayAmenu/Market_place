import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { MAX_CHAT_MESSAGE_LENGTH } from '@marketplace/config';

export class SendMessageDto {
  @IsUUID()
  conversationId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(MAX_CHAT_MESSAGE_LENGTH)
  body!: string;
}

export class SendMessageSocketDto {
  @IsUUID()
  conversationId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(MAX_CHAT_MESSAGE_LENGTH)
  body!: string;
}
