import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
}

export class SendPrivateMessageDto {
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @IsOptional()
  @IsString()
  fileId?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsArray()
  files?: any[];
}

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  recipientId: string;
}

export class MarkAsReadDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;
}

export class DeleteMessageDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;
}
