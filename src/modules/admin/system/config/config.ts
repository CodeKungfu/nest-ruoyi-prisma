import { sys_config } from '@prisma/client';
import { ADMIN_PREFIX } from 'src/modules/admin/admin.constants';
export const keyStr = '配置管理';
export const tableName = 'sys_config';
export const controllerName = 'config';
export type tableType = sys_config;
export { ADMIN_PREFIX };
