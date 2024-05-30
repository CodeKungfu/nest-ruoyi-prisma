import { Inject, Injectable } from '@nestjs/common';
import { ROOT_ROLE_ID } from 'src/modules/admin/admin.constants';
import { ApiException } from 'src/common/exceptions/api.exception';
import { difference, filter, includes, isEmpty, map, findIndex, omit } from 'lodash';
import { prisma } from 'src/prisma';
import { tableType, tableName } from './config';

const transData = (jsonArr) => {
  // 如果roleId存在，筛选出相关项目，否则直接使用原数组
  let readArr = jsonArr;
  // 需要返回数据字段
  readArr = readArr.map((item) => ({
    parentId: Number(item.parentId),
    id: Number(item.menuId),
    label: item.menuName,
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
export class Service {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(
    @Inject(ROOT_ROLE_ID) private rootRoleId: number
  ) {}

  /**
   * 获取所有部门
   */
  async list(): Promise<tableType[]> {
    return await prisma[tableName].findMany({
      orderBy: {
        orderNum: 'desc',
      },
    });
  }

  // exclude
  async exclude(id: any): Promise<tableType[]> {
    return await prisma[tableName].findMany({
      orderBy: {
        orderNum: 'desc',
      },
      where: {
        menuId: {
          not: id,
        },
      },
    });
  }

  // exclude
  async roleMenuTreeselect(roleId: any): Promise<any> {
    const menuList = await prisma[tableName].findMany();
    const menus = transData(menuList);
    const result: any = await prisma.$queryRaw`select m.menu_id
      from sys_menu m
              left join sys_role_menu rm on m.menu_id = rm.menu_id
          where rm.role_id = ${roleId}  and m.menu_id not in (select m.parent_id from sys_menu m inner join sys_role_menu rm on m.menu_id = rm.menu_id and rm.role_id = ${roleId}) order by m.parent_id, m.order_num`;
    const keys = [];
    result.forEach((item) => {
      keys.push(item.menu_id);
    });
    return {
      menus,
      keys,
    };
  }

  async treeselect(uid, params) {
    if (this.rootRoleId === uid) { // 超级管理员
      const menuList: any =  await prisma.$queryRaw`select menu_id, menu_name, parent_id, order_num, path, component, query, is_frame, is_cache, menu_type, visible, status, ifnull(perms,'') as perms, icon, create_time 
      from sys_menu order by parent_id, order_num`;
      const menuArr = menuList.map((item: any) => {
        item.parentId = item.parent_id;
        item.menuId = item.menu_id;
        item.menuName = item.menu_name;
        return item
      })
      const menus = transData(menuArr);
      return menus
    } else {
      // 管理员
      const menuList: any =  await prisma.$queryRaw`select distinct m.menu_id, m.parent_id, m.menu_name, m.path, m.component, m.query, m.visible, m.status, ifnull(m.perms,'') as perms, m.is_frame, m.is_cache, m.menu_type, m.icon, m.order_num, m.create_time
      from sys_menu m
      left join sys_role_menu rm on m.menu_id = rm.menu_id
      left join sys_user_role ur on rm.role_id = ur.role_id
      left join sys_role ro on ur.role_id = ro.role_id
      where ur.user_id = ${params.userId}
      order by m.parent_id, m.order_num
      `;
      const menuArr = menuList.map((item: any) => {
        item.parentId = item.parent_id;
        item.menuId = item.menu_id;
        item.menuName = item.menu_name;
        return item
      })
      const menus = transData(menuArr);
      return menus
    }
  }

  /**
   * 根据获取信息
   */
  async info(id: number): Promise<any> {
    const resultInfo: tableType = await prisma[tableName].findFirst({
      where: {
        menuId: Number(id),
      },
    });
    if (isEmpty(resultInfo)) {
      throw new ApiException(10017);
    }

    return resultInfo;
  }

  /**
   * 根据获取信息
   */
  async delete(id: number): Promise<tableType> {
    const resultInfo: tableType = await prisma[tableName].delete({
      where: {
        menuId: Number(id),
      },
    });
    return resultInfo;
  }

  /**
   * 更新信息
   */
  async update(body: any): Promise<tableType> {
    const updateObj = omit(body, ['menuId', 'createTime']);
    const resultInfo: tableType = await prisma[tableName].update({
      data: updateObj,
      where: {
        menuId: body.menuId,
      },
    });
    return resultInfo;
  }

  /**
   * 新增信息
   */
  async create(body: any): Promise<any> {
    const resultInfo: tableType = await prisma[tableName].create({
      data: body,
    });
    return resultInfo;
  }

  /**
   * 分页查询信息
   */
  async pageDto(dto: any): Promise<any> {
    const queryObj = omit(dto, ['pageNum', 'pageSize']);
    const result: any = await prisma[tableName].findMany({
      skip: (Number(dto.pageNum) - 1) * Number(dto.pageSize),
      take: Number(dto.pageSize),
      where: queryObj,
    });
    const countNum: any = await prisma[tableName].count({
      where: queryObj,
    });
    return {
      result,
      countNum,
    };
  }
}
