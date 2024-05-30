import { ApiProperty } from '@nestjs/swagger';
import { sys_role_dept, sys_role_menu, sys_role } from '@prisma/client';

export class RoleInfo {
  @ApiProperty()
  roleInfo: sys_role;

  @ApiProperty()
  menus: sys_role_menu[];

  @ApiProperty()
  depts: sys_role_dept[];
}

export class CreatedRoleId {
  roleId: number;
}
