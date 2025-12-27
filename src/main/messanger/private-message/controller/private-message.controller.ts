import {
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { GetUser, ValidateAuth } from '@/core/jwt/jwt.decorator';
import { MulterService } from '@/lib/file/services/multer.service';
import { FileType } from '@prisma';
import { SendPrivateMessageDto } from '../dto/privateChatGateway.dto';
import { sendPrivateMessageSwaggerSchema } from '../dto/sendPrivateMessageSwaggerSchema.dto';
import { PrivateChatGateway } from '../message-gateway/message-gateway';
import { PrivateChatService } from '../service/private-message.service';

@ApiTags('messenger - Private Chat')
@Controller('private-chat')
export class PrivateChatController implements OnModuleInit {
  private gateway: PrivateChatGateway;

  constructor(
    private readonly privateService: PrivateChatService,
    @Inject(forwardRef(() => PrivateChatGateway))
    private readonly injectedGateway: PrivateChatGateway,
  ) {}

  onModuleInit() {
    this.gateway = this.injectedGateway;
  }
  @ValidateAuth()
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get All Private message' })
  async getAllPrivateMessage(@GetUser('sub') userId: string) {
    return await this.privateService.getAllChatsWithLastMessage(userId);
  }
  // ----------------- get conversation message----------------
  @ValidateAuth()
  @ApiBearerAuth()
  @Get(':conversationId')
  @ApiOperation({ summary: 'Get messages for a specific private conversation' })
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @GetUser('sub') userId: string,
  ) {
    return await this.privateService.getPrivateConversationWithMessages(
      conversationId,
      userId,
    );
  }
  // -----------send message for-------------------
  @ValidateAuth()
  @ApiBearerAuth()
  @Post('send-message/:recipientId')
  @ApiOperation({ summary: 'Sending Private message' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: sendPrivateMessageSwaggerSchema.properties,
    },
  })
  // @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor(
      'file',
      5,
      new MulterService().createMulterOptions(
        './uploads',
        'content',
        FileType.any,
      ),
    ),
  )
  async sendTeamMessage(
    @Param('recipientId') recipientId: string,
    @Body() dto: SendPrivateMessageDto,
    @GetUser('sub') senderId: string,
  ) {
    if (recipientId === senderId) {
      throw new Error('Cannot send message to yourself');
    }

    const conversation = await this.privateService.findOrCreateConversation(
      senderId,
      recipientId,
    );

    const message = await this.privateService.sendPrivateMessage(
      conversation.id,
      senderId,
      dto,
    );

    // Emit to both sender and recipient
    this.gateway.emitNewMessage(senderId, message);
    this.gateway.emitNewMessage(recipientId, message);

    return { success: true, message };
  }
  @ValidateAuth()
  @ApiBearerAuth()
  @Post('mark-messages-read/:conversationId')
  @ApiOperation({ summary: 'Mark all messages in conversation as read' })
  async markMessagesAsRead(
    @Param('conversationId') conversationId: string,
    @GetUser('sub') userId: string,
  ) {
    await this.privateService.markMessagesAsRead(conversationId, userId);
    return { success: true, message: 'Messages marked as read' };
  }
  @ValidateAuth()
  @ApiBearerAuth()
  @Delete(':conversationId')
  async deleteConversation(@Param('conversationId') conversationId: string) {
    return await this.privateService.deleteConversation(conversationId);
  }
  /**
   * Get all users for private chat (active users shown first)
   * GET /private-message/users/all
   * currentuser NOT included
   */
  @ValidateAuth()
  @ApiBearerAuth()
  @Get('users/all')
  @ApiOperation({ summary: 'Get all users for private chat' })
  async getAllUsers(@GetUser('sub') userId: string) {
    return await this.privateService.getAllUsers(userId);
  }

  /**
   * Search users by name or email
   * GET /private-message/users/search?q=john
   */
  @ValidateAuth()
  @ApiBearerAuth()
  @Get('users/search')
  @ApiOperation({ summary: 'Search users for private chat' })
  async searchUsers(@Query('q') query: string, @GetUser('sub') userId: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    return await this.privateService.searchUsers(query, userId);
  }

  /**
   * Get online status for multiple users
   * POST /private-message/users/status
   */
  @ValidateAuth()
  @ApiBearerAuth()
  @Post('users/status')
  @ApiOperation({ summary: 'Get online status for multiple users' })
  async getUsersStatus(@Body() body: { userIds: string[] }) {
    return await this.privateService.getUsersOnlineStatus(body.userIds);
  }
}
