import { Inject, Injectable } from '@nestjs/common';
import { difference, filter, includes, isEmpty, map } from 'lodash';
import { ROOT_ROLE_ID } from 'src/modules/admin/admin.constants';
import { AdminWSService } from 'src/modules/ws/admin-ws.service';
import { ExcelService } from 'src/shared/services/excel.service';
import { CreateRoleDto, UpdateRoleDto } from './role.dto';
import { CreatedRoleId, RoleInfo } from './role.class';
import { sys_role } from '@prisma/client';
import { prisma } from 'src/prisma';
import { findIndex, omit } from 'lodash';

const transData = (jsonArr) => {
  // 如果roleId存在，筛选出相关项目，否则直接使用原数组
  let readArr = jsonArr;
  // 需要返回数据字段
  readArr = readArr.map((item) => ({
    parentId: Number(item.parentId),
    id: Number(item.deptId),
    label: item.deptName
  }));
  // 建立映射关系
  const idToChildren = new Map();
  for (const item of readArr) {
    item.children = idToChildren.get(item.id) || undefined; // 初始化children
    // 如果有父项，就把自己加到父项的children数组中
    if (!idToChildren.has(item.parentId)) {
      idToChildren.set(item.parentId, []);
    }
    idToChildren.get(item.parentId).push(item);
  }
  function buildTree(item, idToChildren) {
    const children: any = idToChildren.get(item.id) || [];
    if (children.length > 0) {
      for (const child of children) {
        child.children = buildTree(child, idToChildren);
      }
      return children;
    }
  }
  return readArr
    .filter((item) => item.parentId === 0)
    .map((item) => ({
      id: item.id,
      label: item.label,
      children: buildTree(item, idToChildren),
    }));
};

@Injectable()
export class SysRoleService {
  constructor(
    @Inject(ROOT_ROLE_ID) private rootRoleId: number,
    private adminWSService: AdminWSService,
    private excelService: ExcelService,
  ) {}

  /**
   * 列举所有角色：除去超级管理员
   */
  async list(): Promise<sys_role[]> {
    const result = await prisma.sys_role.findMany({
      where: {
        roleId: {
          not: this.rootRoleId,
        },
      },
    });
    return result;
  }

  /**
   * 导出
   */
  async pageDtoExport(dto: any) {
    const queryObj = omit(dto, ['pageNum', 'pageSize']);
    const result: any = await prisma.sys_role.findMany({
      skip: (Number(dto.pageNum) - 1) * Number(dto.pageSize),
      take: Number(dto.pageSize),
      where: queryObj,
    });
    
    return this.excelService.createExcelFile('target', result);
  }

  /**
   * 列举所有角色条数：除去超级管理员
   */
  async count(): Promise<number> {
    const count = await prisma.sys_role.count({
      where: {
        roleId: {
          not: this.rootRoleId,
        },
      },
    });
    return count;
  }

  /**
   * 根据角色获取角色信息
   */
  async detailInfo(rid: number): Promise<any> {
    const roleInfo = await prisma.sys_role.findUnique({
      where: {
        roleId: rid,
      },
    });
    return roleInfo;
  }

  /**
   * 根据角色获取角色信息
   */
  async info(rid: number): Promise<RoleInfo> {
    const roleInfo = await prisma.sys_role.findUnique({
      where: {
        roleId: rid,
      },
    });
    const menus = await prisma.sys_role_menu.findMany({
      where: {
        roleId: rid,
      },
    });
    const depts = await prisma.sys_role_dept.findMany({
      where: {
        roleId: rid,
      },
    });
    return { roleInfo, menus, depts };
  }

  /**
   * 根据角色Id数组删除
   */
  async delete(pramas: any): Promise<void> {
    const roleIds = pramas.ids ? pramas.ids.split(',') : []
    if (includes(roleIds, this.rootRoleId)) {
      throw new Error('Not Support Delete Root');
    }
    await prisma.$transaction(async (prisma) => {
      await prisma.sys_role.deleteMany({
        where: {
          roleId: {
            in: roleIds,
          },
        },
      });
      await prisma.sys_role_menu.deleteMany({
        where: {
          roleId: {
            in: roleIds,
          },
        },
      });
      await prisma.sys_role_dept.deleteMany({
        where: {
          roleId: {
            in: roleIds,
          },
        },
      });
    });
  }

  /**
   * 增加角色
   */
  async add(param: any, uid: number): Promise<any> {
    const { deptCheckStrictly, menuCheckStrictly, roleKey, roleName, roleSort, status, remark, menuIds, deptIds } = param;
    const role = await prisma.sys_role.create({
      data: {
        deptCheckStrictly,
        menuCheckStrictly,
        status,
        roleSort,
        roleName: roleName,
        roleKey: roleKey,
        remark,
      }
    });
    // using transaction
    await prisma.$transaction(async (prisma) => {
      // 菜单
      if (menuIds.length > 0) {
        // 有条目更新
        const insertRows = menuIds.map((e) => {
          return {
            roleId: role.roleId,
            menuId: e,
          };
        });
        await prisma.sys_role_menu.createMany({
          data: insertRows,
        });
      }
      // 部门
      if (deptIds.length > 0) {
        // 有条目更新
        const insertRows = deptIds.map((e) => {
          return {
            roleId: role.roleId,
            departmentId: e,
          };
        });
        await prisma.sys_role_dept.createMany({
          data: insertRows,
        });
      }
    });
    return role;
  }

  /**
   * 更新角色信息
   */
  async update(param: UpdateRoleDto): Promise<sys_role> {
    const { roleId, name, label, remark, menus, depts } = param;
    const role = await prisma.sys_role.update({
      data: {
        roleName: name,
        roleKey: label,
        remark,
      },
      where: {
        roleId: roleId,
      },
    });
    const originDeptRows = await prisma.sys_role_dept.findMany({
      where: {
        roleId: roleId,
      },
    });
    const originMenuRows = await prisma.sys_role_menu.findMany({
      where: {
        roleId: roleId,
      },
    });
    const originMenuIds = originMenuRows.map((e) => {
      return e.menuId;
    });
    const originDeptIds = originDeptRows.map((e) => {
      return e.deptId;
    });
    // 开始对比差异
    const insertMenusRowIds = difference(menus, originMenuIds);
    const deleteMenusRowIds = difference(originMenuIds, menus);
    const insertDeptRowIds = difference(depts, originDeptIds);
    const deleteDeptRowIds = difference(originDeptIds, depts);
    // using transaction
    await prisma.$transaction(async (prisma) => {
      // 菜单
      if (insertMenusRowIds.length > 0) {
        // 有条目更新
        const insertRows = insertMenusRowIds.map((e) => {
          return {
            roleId: roleId,
            menuId: e,
          };
        });
        await prisma.sys_role_menu.createMany({
          data: insertRows,
        });
      }
      if (deleteMenusRowIds.length > 0) {
        // 有条目需要删除
        const realDeleteRowIds = filter(originMenuRows, (e) => {
          return includes(deleteMenusRowIds, e.menuId);
        }).map((e) => {
          return e.id;
        });
        await prisma.sys_role_menu.deleteMany({
          where: {
            roleId: {
              in: realDeleteRowIds,
            },
          },
        });
      }
      // 部门
      if (insertDeptRowIds.length > 0) {
        // 有条目更新
        const insertRows = insertDeptRowIds.map((e) => {
          return {
            roleId: roleId,
            departmentId: e,
          };
        });
        await prisma.sys_role_dept.createMany({
          data: insertRows,
        });
      }
      if (deleteDeptRowIds.length > 0) {
        // 有条目需要删除
        const realDeleteRowIds = filter(originDeptRows, (e) => {
          return includes(deleteDeptRowIds, e.departmentId);
        }).map((e) => {
          return e.id;
        });
        await prisma.sys_role_dept.deleteMany({
          where: {
            roleId: {
              in: realDeleteRowIds,
            },
          },
        });
      }
    });
    // 如果勾选了新的菜单或取消勾选了原有的菜单，则通知前端重新获取权限菜单
    if ([insertMenusRowIds, deleteMenusRowIds].some((n) => n.length)) {
      this.adminWSService.noticeUserToUpdateMenusByRoleIds([roleId]);
    }

    return role;
  }

  /**
   * 更新角色信息, 只正对菜单
   */
  async updateV1(param: any): Promise<sys_role> {
    const { roleId, roleName, roleKey, remark, menuIds } = param;
    const role = await prisma.sys_role.update({
      data: {
        roleName: roleName,
        roleKey: roleKey,
        remark,
      },
      where: {
        roleId: roleId,
      },
    });
    const originMenuRows = await prisma.sys_role_menu.findMany({
      where: {
        roleId: roleId,
      },
    });
    const originMenuIds = originMenuRows.map((e) => {
      return Number(e.menuId);
    });
    // 开始对比差异
    const insertMenusRowIds = difference(menuIds, originMenuIds);
    const deleteMenusRowIds = difference(originMenuIds, menuIds);
    // using transaction
    await prisma.$transaction(async (prisma) => {
      // 菜单
      if (insertMenusRowIds.length > 0) {
        // 有条目更新
        const insertRows = insertMenusRowIds.map((e) => {
          return {
            roleId: roleId,
            menuId: e,
          };
        });
        await prisma.sys_role_menu.createMany({
          data: insertRows,
        });
      }
      if (deleteMenusRowIds.length > 0) {
        // 有条目需要删除
        // const realDeleteRowIds = filter(originMenuRows, (e) => {
        //   return includes(deleteMenusRowIds, e.menuId);
        // }).map((e) => {
        //   return e.id;
        // });
        await prisma.sys_role_menu.deleteMany({
          where: {
            menuId: {
              in: deleteMenusRowIds,
            },
          },
        });
      }
    });
    // 如果勾选了新的菜单或取消勾选了原有的菜单，则通知前端重新获取权限菜单
    if ([insertMenusRowIds, deleteMenusRowIds].some((n) => n.length)) {
      this.adminWSService.noticeUserToUpdateMenusByRoleIds([roleId]);
    }

    return role;
  }

  /**
   * 更新角色信息, 只针对数据权限
   */
  async updateV2(param: any): Promise<any> {
    const { roleId, deptIds } = param;
    const originDeptRows = await prisma.sys_role_dept.findMany({
      where: {
        roleId: roleId,
      },
    });
    const originDeptIds = originDeptRows.map((e) => {
      return Number(e.deptId);
    });
    // 开始对比差异
    const insertDeptRowIds = difference(deptIds, originDeptIds);
    const deleteDeptRowIds = difference(originDeptIds, deptIds);
    // using transaction
    await prisma.$transaction(async (prisma) => {
      // 菜单
      if (insertDeptRowIds.length > 0) {
        // 有条目更新
        const insertRows = insertDeptRowIds.map((e) => {
          return {
            roleId: roleId,
            deptId: e,
          };
        });
        await prisma.sys_role_dept.createMany({
          data: insertRows,
        });
      }
      if (deleteDeptRowIds.length > 0) {
        // 有条目需要删除
        await prisma.sys_role_dept.deleteMany({
          where: {
            deptId: {
              in: deleteDeptRowIds,
            },
          },
        });
      }
    });
    return true;
  }

  async cancelAuthUser(body) {
    return await prisma.sys_user_role.deleteMany({
      where: {
        userId: Number(body.userId),
        roleId: Number(body.roleId)
      }
    })
  }

  async cancelAuthUserAll(body) {
    const userIds = body.userIds ? body.userIds.split(',') : []
    return await prisma.sys_user_role.deleteMany({
      where: {
        userId: {
          in: userIds
        },
        roleId: Number(body.roleId)
      }
    })
  }

  async insertAuthUsers(body) {
    const insertRowIdUsers = body.userIds ? body.userIds.split(',') : []
    // 有条目更新
    const insertRows = insertRowIdUsers.map((e) => {
      return {
        roleId: Number(body.roleId),
        userId: Number(e),
      };
    });
    return await prisma.sys_user_role.createMany({
      data: insertRows,
    });
  }

  /**
   * 分页加载角色信息
   */
  async page(param: any): Promise<sys_role[]> {
    const { limit, page, name, label, remark } = param;
    const result = await prisma.sys_role.findMany({
      where: {
        roleId: {
          not: this.rootRoleId,
        },
        roleName: {
          contains: `${name ? name : ''}`,
        },
        roleKey: {
          contains: `${label ? label : ''}`,
        },
        remark: {
          contains: `${remark ? remark : ''}`,
        },
      },
      orderBy: {
        roleId: 'asc',
      },
      take: limit,
      skip: page * limit,
    });
    return result;
  }

  /**
   * 根据用户id查找角色信息
   */
  async getRoleIdByUser(id: number): Promise<number[]> {
    const result = await prisma.sys_user_role.findMany({
      where: {
        userId: id,
      },
    });
    if (!isEmpty(result)) {
      return map(result, (v) => {
        return Number(v.roleId);
      });
    }
    return [];
  }

  /**
   * 根据角色ID列表查找关联用户ID
   */
  async countUserIdByRole(ids: number[]): Promise<number | never> {
    if (includes(ids, this.rootRoleId)) {
      throw new Error('Not Support Delete Root');
    }
    return await prisma.sys_user_role.count({
      where: {
        roleId: {
          in: ids,
        },
      },
    });
  }

  /**
   * 分页查询信息
   */
  async pageDto(dto: any): Promise<any> {
    const queryObj = omit(dto, ['pageNum', 'pageSize']);
    const result: any = await prisma.sys_user_role.findMany({
      skip: (Number(dto.pageNum) - 1) * Number(dto.pageSize),
      take: Number(dto.pageSize),
      where: queryObj,
    });
    const countNum: any = await prisma.sys_user_role.count({
      where: queryObj,
    });
    const userIds = [];
    result.forEach((item) => {
      userIds.push(item.userId);
    });
    const user = await prisma.sys_user.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });
    return {
      user,
      countNum,
    };
  }

  /**
   * 分页查询信息
   */
  async pageDto1(dto: any): Promise<any> {
    const queryObj = omit(dto, ['pageNum', 'pageSize']);
    const result: any = await prisma.sys_user_role.findMany({
      skip: (Number(dto.pageNum) - 1) * Number(dto.pageSize),
      take: Number(dto.pageSize),
      where: queryObj,
    });
    const countNum: any = await prisma.sys_user_role.count({
      where: queryObj,
    });
    const userIds = [];
    result.forEach((item) => {
      userIds.push(item.userId);
    });
    const user = await prisma.sys_user.findMany({
      where: {
        userId: {
          notIn: userIds,
        },
      },
    });
    return {
      user,
      countNum,
    };
  }

  /**
   * 分页查询信息
   */
  async deptTree(id: any): Promise<any> {
    const deptList: any = await prisma.sys_dept.findMany({
      where: {
        delFlag: '0'
      },
    });
    const deptTree = transData(deptList)
    // 用户选中列表
    const result: any = await prisma.$queryRaw`select d.dept_id 
		    from sys_dept d left join sys_role_dept rd on d.dept_id = rd.dept_id 
        where rd.role_id = ${id} and d.dept_id not in (select d.parent_id from sys_dept d inner join sys_role_dept rd on d.dept_id = rd.dept_id and rd.role_id = ${id}) 
        order by d.parent_id, d.order_num`;
    const checkedKeys = []
    result.forEach((item) => {
      checkedKeys.push(item.dept_id)
    })
    console.log(deptList, checkedKeys)
    return {
      msg: '操作成功',
      code: 200,
      depts: deptTree,
      checkedKeys: checkedKeys,
    };
  }
}
