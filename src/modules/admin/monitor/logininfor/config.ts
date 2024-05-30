import { sys_logininfor } from '@prisma/client';
import { ADMIN_PREFIX } from 'src/modules/admin/admin.constants';
export { ADMIN_PREFIX };
export const keyStr = '操作日志';
export const tableName = 'sys_logininfor';
export const controllerName = 'logininfor';
export type tableType = sys_logininfor;
