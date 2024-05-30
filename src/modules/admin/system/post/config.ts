import { sys_post } from '@prisma/client';
import { ADMIN_PREFIX } from 'src/modules/admin/admin.constants';
export { ADMIN_PREFIX }
export const keyStr = '通知公告';
export const tableName = 'sys_post';
export const controllerName = 'post';
export type tableType = sys_post;
