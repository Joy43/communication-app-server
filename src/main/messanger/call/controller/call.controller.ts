import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { GetUser, ValidateAuth } from '@/core/jwt/jwt.decorator';
import { CallActionDto, InitiateCallDto } from '../dto/call.dto';
import { CallService } from '../service/call.service';

@ApiTags('messenger - Calls')
@Controller('calls')
@ValidateAuth()
@ApiBearerAuth()
export class CallController {
  constructor(private readonly callService: CallService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a call' })
  async initiateCall(
    @Body() dto: InitiateCallDto,
    @GetUser('sub') userId: string,
  ) {
    return await this.callService.initiateCallFromHttp(
      dto.conversationId,
      userId,
      dto.type,
    );
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept a call' })
  async acceptCall(
    @Body() dto: CallActionDto,
    @GetUser('sub') userId: string,
  ) {
    return await this.callService.acceptCallFromHttp(dto.callId, userId);
  }

  @Post('reject')
  @ApiOperation({ summary: 'Reject a call' })
  async rejectCall(
    @Body() dto: CallActionDto,
    @GetUser('sub') userId: string,
  ) {
    return await this.callService.rejectCallFromHttp(dto.callId, userId);
  }

  @Post('end')
  @ApiOperation({ summary: 'End a call' })
  async endCall(
    @Body() dto: CallActionDto,
    @GetUser('sub') userId: string,
  ) {
    return await this.callService.endCallFromHttp(dto.callId, userId);
  }
}