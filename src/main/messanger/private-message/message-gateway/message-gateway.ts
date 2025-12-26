// import { PrismaService } from '@/lib/prisma/prisma.service';
import { Logger } from '@nestjs/common';
// import { ConfigService } from "@nestjs/config";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
// import { PrivateMessageService } from '../service/private-message.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class MessageGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger('MessageGateway.name');
  constructor() {
    // private readonly messageService: PrivateMessageService,
    // private readonly ConfigService: ConfigService,
    // private readonly prisma: PrismaService,
  }
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.logger.log(
      'Socket.IO server initialized FOR PRIVATE CHAT',
      server.adapter.name,
    );
  }

  handleConnection(client: any) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}
