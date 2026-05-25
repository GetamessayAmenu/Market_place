import { IsBoolean, IsUUID } from 'class-validator';

export class TypingEventDto {
  @IsUUID()
  conversationId!: string;

  @IsBoolean()
  isTyping!: boolean;
}
