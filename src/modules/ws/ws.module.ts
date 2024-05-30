import { Module } from '@nestjs/common';
import { AdminWSGateway } from './admin-ws.gateway';
import { AuthService } from './auth.service';
import { AdminWSService } from './admin-ws.service';

const providers = [AdminWSGateway, AuthService, AdminWSService];

/**
 * WebSocket Module
 */
@Module({
  imports: [],
  providers,
  exports: providers,
})
export class WSModule {}
