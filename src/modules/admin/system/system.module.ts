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
import { SysDeptController } from './deptBack/dept.controller';
import { SysDeptService } from './deptBack/dept.service';
import { SysLogController } from './log/log.controller';
import { SysLogService } from './log/log.service';
import { SysMenuController } from './menuBack/menu.controller';
import { SysMenuService } from './menuBack/menu.service';
import { SysRoleController } from './role/role.controller';
import { SysRoleService } from './role/role.service';
import { SysUserController } from './user/user.controller';
import { SysUserService } from './user/user.service';
import { SysTaskController } from './task/task.controller';
import { SysTaskService } from './task/task.service';
import { SysTaskConsumer } from './task/task.processor';
import { SysOnlineController } from './online/online.controller';
import { SysOnlineService } from './online/online.service';
import { SysServeController } from './serve/serve.controller';
import { SysServeService } from './serve/serve.service';

import * as dictController from './dict/controller';
import * as dictService from './dict/service';

import * as dictDataController from './dictData/controller';
import * as dictDataService from './dictData/service';

import * as configController from './config/controller';
import * as configService from './config/service';

import * as noticeController from './notice/controller';
import * as noticeService from './notice/service';

import * as postController from './post/controller';
import * as postService from './post/service';

import * as deptController from './dept/controller';
import * as deptService from './dept/service';

import * as menuController from './menu/controller';
import * as menuService from './menu/service';

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
    SysUserController,
    SysRoleController,
    SysMenuController,
    menuController.MyController,
    SysDeptController,
    deptController.MyController,
    SysLogController,
    SysTaskController,
    SysOnlineController,
    SysServeController,
    dictController.MyController,
    dictDataController.MyController,
    configController.MyController,
    noticeController.MyController,
    postController.MyController,
  ],
  providers: [
    rootRoleIdProvider(),
    SysUserService,
    SysRoleService,
    SysMenuService,
    menuService.Service,
    SysDeptService,
    deptService.Service,
    SysLogService,
    SysTaskService,
    SysTaskConsumer,
    SysOnlineService,
    SysServeService,
    dictService.Service,
    dictDataService.Service,
    configService.Service,
    noticeService.Service,
    postService.Service,
  ],
  exports: [
    ROOT_ROLE_ID,
    SysUserService,
    SysMenuService,
    SysLogService,
    SysOnlineService,
  ],
})
export class SystemModule {}
