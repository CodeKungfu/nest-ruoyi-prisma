import { Inject, Injectable } from '@nestjs/common';
import { concat, includes, isEmpty, uniq } from 'lodash';
import { ROOT_ROLE_ID } from 'src/modules/admin/admin.constants';
import { ApiException } from 'src/common/exceptions/api.exception';
import { RedisService } from 'src/shared/services/redis.service';
import { AdminWSService } from 'src/modules/ws/admin-ws.service';
import { SysRoleService } from '../role/role.service';
import { MenuItemAndParentInfoResult } from './menu.class';
import { CreateMenuDto } from './menu.dto';
import { prisma } from 'src/prisma';
import { sys_menu } from '@prisma/client';

@Injectable()
export class SysMenuService {
  constructor(
    private redisService: RedisService,
    @Inject(ROOT_ROLE_ID) private rootRoleId: number,
    private roleService: SysRoleService,
    private adminWSService: AdminWSService,
  ) {}

  /**
   * 获取所有菜单
   */
  async list(): Promise<sys_menu[]> {
    return await prisma.sys_menu.findMany();
  }

  /**
   * 保存或新增菜单
   */
  async save(menu: any & { id?: number }): Promise<void> {
    if (menu.menu_id) {
      const menuId = menu.menu_id;
      delete menu.id;
      delete menu.menuId;
      await prisma.sys_menu.update({
        data: menu,
        where: {
          menuId: menuId,
        },
      });
    } else {
      await prisma.sys_menu.create({
        data: menu,
      });
    }
    // await this.menuRepository.save(menu);
    this.adminWSService.noticeUserToUpdateMenusByRoleIds([this.rootRoleId]);
  }

  /**
   * 根据角色获取所有菜单
   */
  async getMenus(uid: number): Promise<sys_menu[]> {
    const roleIds = await this.roleService.getRoleIdByUser(uid);
    let menus: sys_menu[] = [];
    if (includes(roleIds, this.rootRoleId)) {
      // root find all
      menus = await prisma.sys_menu.findMany();
    } else {
      // [ 1, 2, 3 ] role find
      menus =
        await prisma.$queryRaw`SELECT menu.* FROM sys_menu menu INNER JOIN sys_role_menu role_menu ON menu.id = role_menu.menu_id where role_menu.role_id IN (${roleIds.join(
          ',',
        )}) order by menu.order_num DESC`;
    }
    return menus;
  }

  /**
   * 检查菜单创建规则是否符合
   */
  async check(dto: CreateMenuDto & { menuId?: number }): Promise<void | never> {
    if (dto.type === 2 && dto.parentId === -1) {
      // 无法直接创建权限，必须有ParentId
      throw new ApiException(10005);
    }
    if (dto.type === 1 && dto.parentId !== -1) {
      const parent = await this.getMenuItemInfo(dto.parentId);
      if (isEmpty(parent)) {
        throw new ApiException(10014);
      }
      if (parent && parent.menuType === '1') {
        // 当前新增为菜单但父节点也为菜单时为非法操作
        throw new ApiException(10006);
      }
    }
    //判断同级菜单路由是否重复
    if (!Object.is(dto.type, 2)) {
      // 查找所有一级菜单
      // const menus = await this.menuRepository.find({
      //   where: {
      //     parentId: Object.is(dto.parent_id, -1) ? null : dto.parent_id,
      //   },
      // });
      const menus = await prisma.sys_menu.findMany({
        where: {
          parentId: Object.is(dto.parentId, -1) ? null : dto.parentId,
        },
      });
      const router = dto.router.split('/').filter(Boolean).join('/');
      const pathReg = new RegExp(`^/?${router}/?$`);
      const isExist = menus.some(
        (n) => pathReg.test(n.perms) && Number(n.menuId) !== dto.menuId,
      );
      if (isExist) {
        // 同级菜单路由不能重复
        throw new ApiException(10004);
      }
    }
  }

  /**
   * 查找当前菜单下的子菜单，目录以及菜单
   */
  async findChildMenus(mid: number): Promise<any> {
    const allMenus: any = [];
    const menus = await prisma.sys_menu.findMany({
      where: {
        parentId: mid,
      },
    });
    // if (_.isEmpty(menus)) {
    //   return allMenus;
    // }
    // const childMenus: any = [];
    for (let i = 0; i < menus.length; i++) {
      if (menus[i].menuType !== '2') {
        // 子目录下是菜单或目录，继续往下级查找
        const c = await this.findChildMenus(Number(menus[i].menuId));
        allMenus.push(c);
      }
      allMenus.push(menus[i].menuId);
    }
    return allMenus;
  }

  /**
   * 获取某个菜单的信息
   * @param mid menu id
   */
  async getMenuItemInfo(mid: number): Promise<sys_menu> {
    const menu = await prisma.sys_menu.findUnique({
      where: {
        menuId: mid,
      },
    });
    return menu;
  }

  /**
   * 获取某个菜单以及关联的父菜单的信息
   */
  async getMenuItemAndParentInfo(
    mid: number,
  ): Promise<MenuItemAndParentInfoResult> {
    const menu = await prisma.sys_menu.findUnique({
      where: {
        menuId: mid,
      },
    });
    let parentMenu: sys_menu | undefined = undefined;
    if (menu && menu.parentId) {
      parentMenu = await prisma.sys_menu.findUnique({
        where: {
          menuId: menu.parentId,
        },
      });
    }
    return { menu, parentMenu };
  }

  /**
   * 查找节点路由是否存在
   */
  async findRouterExist(perms: string): Promise<boolean> {
    const menus = await prisma.sys_menu.findFirst({
      where: {
        perms,
      },
    });
    return !isEmpty(menus);
  }

  /**
   * 获取当前用户的所有权限
   */
  async getPerms(uid: number): Promise<string[]> {
    const roleIds = await this.roleService.getRoleIdByUser(uid);
    let perms: any[] = [];
    let result: any = null;
    if (includes(roleIds, this.rootRoleId)) {
      // root find all perms
      result = await prisma.sys_menu.findMany({
        where: {
          perms: {
            not: null,
          },
          menuType: '2',
        },
      });
    } else {
      // result = await this.menuRepository
      //   .createQueryBuilder('menu')
      //   .innerJoinAndSelect(
      //     'sys_role_menu',
      //     'role_menu',
      //     'menu.id = role_menu.menu_id',
      //   )
      //   .andWhere('role_menu.role_id IN (:...roldIds)', { roldIds: roleIds })
      //   .andWhere('menu.type = 2')
      //   .andWhere('menu.perms IS NOT NULL')
      //   .getMany();
      result =
        await prisma.$queryRaw`SELECT * FROM sys_menu menu INNER JOIN sys_role_menu role_menu ON menu.id = role_menu.menu_id where role_menu.role_id IN (${roleIds.join(
          ',',
        )}) and menu.type = 2 and  menu.perms IS NOT NULL`;
    }
    if (!isEmpty(result)) {
      result.forEach((e) => {
        perms = concat(perms, e.perms.split(','));
      });
      perms = uniq(perms);
    }
    return perms;
  }

  /**
   * 删除多项菜单
   */
  async deleteMenuItem(mids: number[]): Promise<void> {
    await prisma.sys_menu.deleteMany({
      where: {
        menuId: {
          in: mids,
        },
      },
    });
    this.adminWSService.noticeUserToUpdateMenusByMenuIds(mids);
  }

  /**
   * 刷新指定用户ID的权限
   */
  async refreshPerms(uid: number): Promise<void> {
    const perms = await this.getPerms(uid);
    const online = await this.redisService.getRedis().get(`admin:token:${uid}`);
    if (online) {
      // 判断是否在线
      await this.redisService
        .getRedis()
        .set(`admin:perms:${uid}`, JSON.stringify(perms));
    }
  }

  /**
   * 刷新所有在线用户的权限
   */
  async refreshOnlineUserPerms(): Promise<void> {
    const onlineUserIds: string[] = await this.redisService
      .getRedis()
      .keys('admin:token:*');
    if (onlineUserIds && onlineUserIds.length > 0) {
      for (let i = 0; i < onlineUserIds.length; i++) {
        const uid = onlineUserIds[i].split('admin:token:')[1];
        const perms = await this.getPerms(parseInt(uid));
        await this.redisService
          .getRedis()
          .set(`admin:perms:${uid}`, JSON.stringify(perms));
      }
    }
  }
}
