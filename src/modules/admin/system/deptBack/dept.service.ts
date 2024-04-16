import { Inject, Injectable } from '@nestjs/common';
import { includes, isEmpty } from 'lodash';
import { ROOT_ROLE_ID } from 'src/modules/admin/admin.constants';
import { ApiException } from 'src/common/exceptions/api.exception';

import { SysRoleService } from '../role/role.service';
import { DeptDetailInfo } from './dept.class';
import { MoveDept, UpdateDeptDto } from './dept.dto';

import { prisma } from 'src/prisma';
import { sys_dept } from '@prisma/client';

@Injectable()
export class SysDeptService {
  constructor(
    @Inject(ROOT_ROLE_ID) private rootRoleId: number,
    private roleService: SysRoleService,
  ) {}

  /**
   * 获取所有部门
   */
  async list(): Promise<sys_dept[]> {
    return await prisma.sys_dept.findMany({
      orderBy: {
        orderNum: 'desc',
      },
    });
  }

  /**
   * 根据ID查找部门信息
   */
  async info(id: number): Promise<DeptDetailInfo> {
    const department = await prisma.sys_dept.findUnique({
      where: {
        deptId: id,
      },
    });
    if (isEmpty(department)) {
      throw new ApiException(10019);
    }
    let parentDepartment = null;
    if (department.parentId) {
      parentDepartment = await prisma.sys_dept.findUnique({
        where: {
          deptId: department.parentId,
        },
      });
    }
    return { department, parentDepartment };
  }

  /**
   * 更新部门信息
   */
  async update(param: UpdateDeptDto): Promise<void> {
    await prisma.sys_dept.update({
      data: {
        parentId: param.parent_id === -1 ? undefined : param.parent_id,
        deptName: param.name,
        orderNum: param.order_num,
      },
      where: { deptId: param.id },
    });
  }

  /**
   * 转移部门
   */
  async transfer(userIds: number[], deptId: number): Promise<void> {
    await prisma.sys_user.updateMany({
      data: {
        dept_id: deptId,
      },
      where: {
        user_id: { in: userIds },
      },
    });
  }

  /**
   * 新增部门
   */
  async add(deptName: string, parentDeptId: number): Promise<void> {
    await prisma.sys_dept.create({
      data: {
        deptName: deptName,
        parentId: parentDeptId === -1 ? null : parentDeptId,
      },
    });
  }

  /**
   * 移动排序
   */
  async move(depts: MoveDept[]): Promise<void> {
    await prisma.$transaction(async (prisma) => {
      for (const item of depts) {
        await prisma.sys_dept.update({
          data: {
            parentId: item.parent_id,
          },
          where: {
            deptId: item.id,
          },
        });
      }
    });
  }

  /**
   * 根据ID删除部门
   */
  async delete(departmentId: number): Promise<void> {
    await prisma.sys_dept.delete({
      where: {
        deptId: departmentId,
      },
    });
  }

  /**
   * 根据部门查询关联的用户数量
   */
  async countUserByDeptId(id: number): Promise<number> {
    return await prisma.sys_user.count({
      where: {
        dept_id: id,
      },
    });
  }

  /**
   * 根据部门查询关联的角色数量
   */
  async countRoleByDeptId(id: number): Promise<number> {
    return await prisma.sys_role_dept.count({
      where: {
        dept_id: id,
      },
    });
  }

  /**
   * 查找当前部门下的子部门数量
   */
  async countChildDept(id: number): Promise<number> {
    return await prisma.sys_dept.count({
      where: {
        parentId: id,
      },
    });
  }

  /**
   * 根据当前角色id获取部门列表
   */
  async getDepts(uid: number): Promise<sys_dept[]> {
    const roleIds = await this.roleService.getRoleIdByUser(uid);
    let depts: any = [];
    if (includes(roleIds, this.rootRoleId)) {
      // root find all
      depts = await prisma.sys_dept.findMany();
    } else {
      // [ 1, 2, 3 ] role find
      depts =
        await prisma.$queryRaw`SELECT * FROM sys_dept dept INNER JOIN sys_role_dept role_dept ON dept.id = role_dept.department_id where role_dept.role_id IN (${roleIds.join(
          ',',
        )}) order by dept.order_num ASC`;
    }
    return depts;
  }
}
