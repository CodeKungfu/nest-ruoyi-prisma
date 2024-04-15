import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ROOT_ROLE_ID,
  SYS_TASK_QUEUE_NAME,
  SYS_TASK_QUEUE_PREFIX,
} from 'src/modules/admin/admin.constants';
import { WSModule } from 'src/modules/ws/ws.module';
import { rootRoleIdProvider } from '../core/provider/root-role-id.provider';

import * as operlogController from './operlog/controller';
import * as operlogService from './operlog/service';

import * as logininforController from './logininfor/controller';
import * as logininforService from './logininfor/service';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: SYS_TASK_QUEUE_NAME,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password'),
          db: configService.get<number>('redis.db'),
        },
        prefix: SYS_TASK_QUEUE_PREFIX,
      }),
      inject: [ConfigService],
    }),
    WSModule,
  ],
  controllers: [
    // dictController.MyController,
    // dictDataController.MyController,
    // configController.MyController,
    // noticeController.MyController,
    logininforController.MyController,
    operlogController.MyController,
  ],
  providers: [
    rootRoleIdProvider(),
    // dictService.Service,
    // dictDataService.Service,
    // configService.Service,
    // noticeService.Service,
    logininforService.Service,
    operlogService.Service,
  ],
  exports: [ROOT_ROLE_ID],
})
export class MonitorModule {}
