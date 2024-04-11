import { ApiProperty } from '@nestjs/swagger';
import { sys_dept } from '@prisma/client';

export class DeptDetailInfo {
  @ApiProperty({ description: '当前查询的部门' })
  department?: sys_dept;

  @ApiProperty({ description: '所属父级部门' })
  parentDepartment?: sys_dept;
}
