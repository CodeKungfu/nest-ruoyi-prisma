import { SetMetadata } from '@nestjs/common';
import { REQUIRES_PERMISSIONS_METADATA } from '../contants/decorator.contants';

/**
 * 权限字符串
 */
export const RequiresPermissions = (perms) => SetMetadata(REQUIRES_PERMISSIONS_METADATA, perms);
