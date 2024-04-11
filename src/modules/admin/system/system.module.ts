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
import { SysDeptController } from './dept/dept.controller';
import { SysDeptService } from './dept/dept.service';
import { SysLogController } from './log/log.controller';
import { SysLogService } from './log/log.service';
import { SysMenuController } from './menu/menu.controller';
import { SysMenuService } from './menu/menu.service';
import { SysRoleController } from './role/role.controller';
import { SysRoleService } from './role/role.service';
import { SysUserController } from './user/user.controller';
import { SysUserService } from './user/user.service';
import { SysTaskController } from './task/task.controller';
import { SysTaskService } from './task/task.service';
import { SysTaskConsumer } from './task/task.processor';
import { SysOnlineController } from './online/online.controller';
import { SysOnlineService } from './online/online.service';
import { SysParamConfigController } from './param-config/param-config.controller';
import { SysParamConfigService } from './param-config/param-config.service';
import { SysServeController } from './serve/serve.controller';
import { SysServeService } from './serve/serve.service';

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
    SysDeptController,
    SysLogController,
    SysTaskController,
    SysOnlineController,
    SysParamConfigController,
    SysServeController,
  ],
  providers: [
    rootRoleIdProvider(),
    SysUserService,
    SysRoleService,
    SysMenuService,
    SysDeptService,
    SysLogService,
    SysTaskService,
    SysTaskConsumer,
    SysOnlineService,
    SysParamConfigService,
    SysServeService,
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
