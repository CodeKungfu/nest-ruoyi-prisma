import { Inject, Injectable } from '@nestjs/common';
// import { camelCase, isEmpty } from 'lodash';
import { findIndex, isEmpty } from 'lodash';
import { ApiException } from 'src/common/exceptions/api.exception';
import { UtilService } from 'src/shared/services/util.service';
import { ExcelService } from 'src/shared/services/excel.service';
import { ROOT_ROLE_ID } from 'src/modules/admin/admin.constants';
import { RedisService } from 'src/shared/services/redis.service';
import { SYS_USER_INITPASSWORD } from 'src/common/contants/param-config.contants';
// import { SysParamConfigService } from '../param-config/param-config.service';
import { AccountInfo, PageSearchUserInfo } from './user.class';
import { CreateUserDto, PageSearchUserDto, UpdatePasswordDto, UpdateUserDto, UpdateUserInfoDto } from './user.dto';
import { omit } from 'lodash';
import { prisma } from 'src/prisma';
import { sys_user } from '@prisma/client';

// 能用1
// const transData = (jsonArr, roleId) => {
//   let readArr = [];
//   if (roleId) {
//     jsonArr.forEach((item) => {
//       if (item.roleId === roleId) {
//         readArr.push(item);
//       }
//     });
//   } else {
//     readArr = jsonArr;
//   }
//   // 调用方法， temp为原始数据, result为树形结构数据
//   const result = generateOptions(readArr);

//   // 开始递归方法
//   function generateOptions(params) {
//     const result: any = [];
//     for (const param of params) {
//       if (Number(param.parentId) === 0) {
//         // 判断是否为顶层节点
//         const parent: any = {
//           id: param.deptId,
//           label: param.deptName,
//         };
//         parent.children = getchilds(param.deptId, params); // 获取子节点
//         result.push(parent);
//       }
//     }
//     return result;
//   }

//   function getchilds(id, array) {
//     const childs = [];
//     for (const arr of array) {
//       // 循环获取子节点
//       if (arr.parentId === id) {
//         childs.push({
//           id: arr.deptId,
//           label: arr.deptName,
//         });
//       }
//     }
//     for (const child of childs) {
//       // 获取子节点的子节点
//       const childscopy = getchilds(child.id, array); // 递归获取子节点
//       if (childscopy.length > 0) {
//         child.children = childscopy;
//       }
//     }
//     return childs;
//   }
//   return result;
// };

// 能用2
// const transData = (jsonArr, roleId) => {
//   // 如果roleId存在，筛选出相关项目，否则直接使用原数组
//   const readArr = roleId
//     ? jsonArr.filter((item) => item.roleId === roleId)
//     : jsonArr;

//   // 建立映射关系
//   const idToChildren = new Map();
//   for (const item of readArr) {
//     item.children = idToChildren.get(Number(item.deptId)) || []; // 初始化children
//     // 如果有父项，就把自己加到父项的children数组中
//     if (!idToChildren.has(Number(item.parentId))) {
//       idToChildren.set(Number(item.parentId), []);
//     }
//     idToChildren.get(Number(item.parentId)).push({
//       id: Number(item.deptId),
//       label: item.deptName,
//       children: item.children || undefined,
//     });
//   }
//   // 根结点
//   const filterArr = readArr
//     .filter((item) => Number(item.parentId) === 0)
//     .map((item) => ({
//       id: Number(item.deptId),
//       label: item.deptName,
//     }));
//   const result = filterArr.map((item) => ({
//     id: item.id,
//     label: item.label,
//     children: buildTree(item, idToChildren),
//   }));

//   function buildTree(item, idToChildren) {
//     const children: any = idToChildren.get(item.id) || [];
//     if (children.length > 0) {
//       for (const child of children) {
//         child.children = buildTree(child, idToChildren);
//       }
//       return children;
//     }
//   }
//   return result;
// };

const transData = (jsonArr, roleId) => {
  // 如果roleId存在，筛选出相关项目，否则直接使用原数组
  let readArr = roleId ? jsonArr.filter((item) => item.roleId === roleId) : jsonArr;
  // 需要返回数据字段
  readArr = readArr.map((item) => ({
    parentId: Number(item.parentId),
    id: Number(item.deptId),
    label: item.deptName,
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
export class SysUserService {
  constructor(
    private redisService: RedisService,
    // private paramConfigService: SysParamConfigService,
    @Inject(ROOT_ROLE_ID) private rootRoleId: number,
    private util: UtilService,
    private excelService: ExcelService,
  ) {}


  /**
   * 分页查询信息
   */
  async pageDtoExport(dto: any): Promise<any> {
    const queryObj = omit(dto, ['pageNum', 'pageSize']);
    const result: any = await prisma.sys_user.findMany({
      skip: (Number(dto.pageNum) - 1) * Number(dto.pageSize),
      take: Number(dto.pageSize),
      where: queryObj,
    });
    
    return this.excelService.createExcelFile('target', result);
  }

  /**
   * 根据用户名查找已经启用的用户
   */
  async findUserByUserName(username: string): Promise<sys_user | undefined> {
    return await prisma.sys_user.findFirst({
      where: {
        userName: username,
        status: '0',
      },
    });
  }
  /**
   * 根据获取信息
   */
  async infoUser0(id: number): Promise<any> {
    const resultInfo: any = await prisma.sys_user.findFirst({
      where: {
        userId: Number(id),
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
  async infoUser(id: number): Promise<any> {
    const posts: any = await prisma.sys_post.findMany();
    const roles: any = await prisma.sys_role.findMany();
    const resultInfo: any = await prisma.sys_user.findFirst({
      where: {
        userId: Number(id),
      },
    });
    if (isEmpty(resultInfo)) {
      throw new ApiException(10017);
    }
    const roleRows: any = await prisma.sys_user_role.findMany({
      where: {
        userId: Number(id),
      },
    });
    const postRows: any = await prisma.sys_user_post.findMany({
      where: {
        userId: Number(id),
      },
    });

    const postIds = [];
    const roleIds = [];
    roleRows.forEach((item) => {
      roleIds.push(Number(item.roleId));
    });
    postRows.forEach((item) => {
      postIds.push(Number(item.postId));
    });
    return {
      posts,
      roles,
      postIds,
      roleIds,
      data: resultInfo,
    };
  }

  /**
   * 根据获取信息
   */
  async infoUserV1(): Promise<any> {
    const posts: any = await prisma.sys_post.findMany();
    const roles: any = await prisma.sys_role.findMany();
    return {
      posts,
      roles,
    };
  }

  /**
   * 根据获取信息
   */
  async infoUserRole(id: number): Promise<any> {
    const userRole: any = await prisma.sys_user_role.findFirst({
      where: {
        userId: Number(id),
      },
    });
    let resultInfo: any = [];
    if (userRole) {
      resultInfo = await prisma.sys_role.findMany({
        where: {
          roleId: userRole.role_id,
          delFlag: '0',
        },
      });
    }
    const allRowsInfo: any = await prisma.sys_role.findMany({
      where: {
        delFlag: '0',
      },
    });
    if (this.rootRoleId === Number(id)) {
      return allRowsInfo;
    } else {
      const out = [];
      allRowsInfo.forEach((item: any) => {
        if (item.roleKey !== 'admin') {
          let find = false;
          resultInfo.forEach((item1: any) => {
            if (item1.roleKey !== 'admin') {
              if (Number(item.roleId) === Number(item1.roleId)) {
                find = true;
              }
            }
          });
          if (find) {
            item.flag = true;
            out.push(item);
          } else {
            out.push(item);
          }
        }
      });
      return out;
    }
  }

  /**
   * deptTree
   */
  async deptTree(): Promise<any> {
    const deptTable = await await prisma.sys_dept.findMany();
    const data = transData(deptTable, '');
    return {
      msg: '操作成功',
      code: 200,
      data: data,
    };
  }
  /**
   * 获取用户信息
   * @param uid user id
   * @param ip login ip
   */
  async getAccountInfo(uid: number, ip?: string): Promise<AccountInfo> {
    // const user: sys_user = await this.userRepository.findOne({
    //   where: { id: uid },
    // });
    const user: sys_user = await prisma.sys_user.findUnique({
      where: {
        userId: uid,
      },
    });
    if (isEmpty(user)) {
      throw new ApiException(10017);
    }
    return {
      name: user.userName,
      nickName: user.nickName,
      email: user.email,
      phone: user.phonenumber,
      remark: user.remark,
      headImg: user.avatar,
      loginIp: ip,
    };
  }

  /**
   * 获取用户信息
   * @param uid user id
   * @param ip login ip
   */
  async getInfo(uid: number, ip?: string): Promise<any> {
    const user: sys_user = await prisma.sys_user.findFirst({
      where: {
        userId: uid,
      },
    });
    if (isEmpty(user)) {
      throw new ApiException(10017);
    }
    const perm = await this.redisService.getRedis().get(`admin:perms:${user.userId}`);
    return {
      permissions: JSON.parse(perm),
      roles: ['admin'],
      user: {
        name: user.userName,
        nickName: user.nickName,
        email: user.email,
        phone: user.phonenumber,
        remark: user.remark,
        headImg: user.avatar,
        loginIp: ip,
      },
    };
  }

  /**
   * 更新个人信息
   */
  async updatePersonInfo(uid: number, info: UpdateUserInfoDto): Promise<void> {
    await prisma.sys_user.update({
      data: info,
      where: {
        userId: uid,
      },
    });
  }

  /**
   * 更改管理员密码
   */
  async updatePassword(uid: number, dto: UpdatePasswordDto): Promise<void> {
    const user = await prisma.sys_user.findUnique({
      where: {
        userId: uid,
      },
    });
    if (isEmpty(user)) {
      throw new ApiException(10017);
    }
    const comparePassword = this.util.md5(`${dto.originPassword}`);
    // 原密码不一致，不允许更改
    if (user.password !== comparePassword) {
      throw new ApiException(10011);
    }
    const password = this.util.md5(`${dto.newPassword}`);
    await prisma.sys_user.update({
      data: { password },
      where: {
        userId: uid,
      },
    });
    await this.upgradePasswordV(Number(user.userId));
  }

  /**
   * 直接更改管理员密码
   */
  async forceUpdatePassword(uid: number, password: string): Promise<void> {
    const user = await prisma.sys_user.findUnique({
      where: {
        userId: uid,
      },
    });
    if (isEmpty(user)) {
      throw new ApiException(10017);
    }
    const newPassword = this.util.md5(`${password}`);
    await prisma.sys_user.update({
      data: { password: newPassword },
      where: {
        userId: uid,
      },
    });
    await this.upgradePasswordV(Number(user.userId));
  }

  /**
   * 增加系统用户，如果返回false则表示已存在该用户
   * @param param Object 对应SysUser实体类
   */
  async create(param: any): Promise<void> {
    const exists = await prisma.sys_user.findFirst({
      where: {
        userName: param.userName,
      },
    });
    if (!isEmpty(exists)) {
      throw new ApiException(10001);
    }
    if (param.phonenumber) {
      const existsU = await prisma.sys_user.findFirst({
        where: {
          phonenumber: param.phonenumber,
        },
      });
      if (!isEmpty(existsU)) {
        throw new ApiException(10001);
      }
    }
    // 所有用户初始密码为123456
    await prisma.$transaction(async (prisma) => {
      // const salt = await this.util.generateRandomValue(32);
      // 查找配置的初始密码
      // const initPassword = await this.paramConfigService.findValueByKey(
      //   SYS_USER_INITPASSWORD,
      // );
      const initPassword = param.password;
      const password = this.util.md5(`${initPassword ?? '123456'}`);
      const result = await prisma.sys_user.create({
        data: {
          deptId: param.deptId,
          userName: param.userName,
          password,
          nickName: param.nickName,
          email: param.email,
          phonenumber: param.phonenumber,
          remark: param.remark,
          status: param.status.toString(),
        },
      });
      const { roleIds = [], postIds = [] } = param;
      if (roleIds.length > 0) {
        const insertRoles = roleIds.map((e) => {
          return {
            roleId: Number(e),
            userId: Number(result.userId),
          };
        });
        // 分配角色
        await prisma.sys_user_role.createMany({
          data: insertRoles,
        });
      }
      if (postIds.length > 0) {
        const insertPosts = postIds.map((e) => {
          return {
            postId: Number(e),
            userId: Number(result.userId),
          };
        });
        // 分配角色
        await prisma.sys_user_post.createMany({
          data: insertPosts,
        });
      }
    });
  }

  /**
   * 更新用户信息
   */
  async update(param: any): Promise<void> {
    const exists = await prisma.sys_user.findFirst({
      where: {
        userName: param.userName,
        userId: {
          not: param.userId,
        },
      },
    });
    if (!isEmpty(exists)) {
      throw new ApiException(10001);
    }
    if (param.phonenumber) {
      const existsU = await prisma.sys_user.findFirst({
        where: {
          phonenumber: param.phonenumber,
          userId: {
            not: param.userId,
          },
        },
      });
      if (!isEmpty(existsU)) {
        throw new ApiException(10001);
      }
    }
    await prisma.$transaction(async (prisma) => {
      await prisma.sys_user.update({
        data: {
          deptId: param.deptId,
          userName: param.userName,
          nickName: param.nickName,
          email: param.email,
          phonenumber: param.phonenumber,
          remark: param.remark,
          status: param.status.toString(),
        },
        where: {
          userId: param.userId,
        },
      });
      // 先删除原来的角色关系
      await prisma.sys_user_role.deleteMany({
        where: {
          userId: Number(param.userId),
        },
      });
      await prisma.sys_user_post.deleteMany({
        where: {
          userId: Number(param.userId),
        },
      });

      const { roleIds = [], postIds = [] } = param;
      if (roleIds.length > 0) {
        const insertRoles = roleIds.map((e) => {
          return {
            roleId: Number(e),
            userId: Number(param.userId),
          };
        });
        // 分配角色
        await prisma.sys_user_role.createMany({
          data: insertRoles,
        });
      }
      if (postIds.length > 0) {
        const insertPosts = postIds.map((e) => {
          return {
            postId: Number(e),
            userId: Number(param.userId),
          };
        });
        // 分配角色
        await prisma.sys_user_post.createMany({
          data: insertPosts,
        });
      }
      // if (param.status === 0) {
      //   // 禁用状态
      //   await this.forbidden(param.id);
      // }
    });
  }

  /**
   * 查找列表里的信息
   */
  async infoList(ids: number[]): Promise<sys_user[]> {
    const users = await prisma.sys_user.findMany({
      where: {
        userId: {
          in: ids,
        },
      },
    });
    return users;
  }

  /**
   * 根据ID列表删除用户
   */
  async delete(ids: any): Promise<void | never> {
    const rootUserId = this.rootRoleId;
    const userIds = ids.split(',');
    if (userIds.includes(rootUserId.toString())) {
      throw new Error('can not delete root user!');
    }
    await prisma.sys_user.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });
    await prisma.sys_user_role.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });
    await prisma.sys_user_post.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    });
  }

  async insertAuthRole(userId, roleIds): Promise<any> {
    // 先删除原来的角色关系
    await prisma.sys_user_role.deleteMany({
      where: {
        userId: Number(userId),
      },
    });
    if (roleIds) {
      const arr = roleIds.split(',');
      const insertRoles = arr.map((e) => {
        return {
          roleId: Number(e),
          userId: Number(userId),
        };
      });
      // 分配角色
      await prisma.sys_user_role.createMany({
        data: insertRoles,
      });
    }
  }

  /**
   * 根据部门ID列举用户条数：除去超级管理员
   */
  async count(uid: number, deptIds: number[]): Promise<number> {
    const queryAll: boolean = isEmpty(deptIds);
    const rootUserId = await this.findRootUserId();
    if (queryAll) {
      return await prisma.sys_user.count({
        where: {
          userId: {
            notIn: [Number(rootUserId), uid],
          },
        },
      });
    }
    return await prisma.sys_user.count({
      where: {
        userId: {
          notIn: [Number(rootUserId), uid],
        },
        deptId: {
          in: deptIds,
        },
      },
    });
  }

  /**
   * 查找超管的用户ID
   */
  async findRootUserId(): Promise<bigint> {
    const result = await prisma.sys_user_role.findMany({
      where: {
        roleId: this.rootRoleId,
      },
    });
    return result[0].userId;
  }

  /**
   * 分页查询信息
   */
  async pageDto(dto: any): Promise<any> {
    const queryObj = omit(dto, ['pageNum', 'pageSize']);
    const result: any = await prisma.sys_user.findMany({
      skip: (Number(dto.pageNum) - 1) * Number(dto.pageSize),
      take: Number(dto.pageSize),
      where: queryObj,
    });
    const countNum: any = await prisma.sys_user.count({
      where: queryObj,
    });
    return {
      result,
      countNum,
    };
  }

  /**
   * 根据部门ID进行分页查询用户列表
   * deptId = -1 时查询全部
   */
  async page(uid: number, params: PageSearchUserDto): Promise<PageSearchUserInfo[]> {
    // const { departmentIds, limit, page, name, username, phone, remark } =
    //   params;
    const { departmentIds, limit, page } = params;
    // const queryAll: boolean = isEmpty(departmentIds);
    // const rootUserId = await this.findRootUserId();
    // const qb = this.userRepository
    //   .createQueryBuilder('user')
    //   .innerJoinAndSelect(
    //     'sys_dept',
    //     'dept',
    //     'dept.id = user.departmentId',
    //   )
    //   .innerJoinAndSelect(
    //     'sys_user_role',
    //     'user_role',
    //     'user_role.user_id = user.id',
    //   )
    //   .innerJoinAndSelect('sys_role', 'role', 'role.id = user_role.role_id')
    //   .select([
    //     'user.id,GROUP_CONCAT(role.name) as roleNames',
    //     'dept.name',
    //     'user.*',
    //   ])
    //   .where('user.id NOT IN (:...ids)', { ids: [rootUserId, uid] })
    //   .andWhere(queryAll ? '1 = 1' : 'user.departmentId IN (:...deptIds)', {
    //     deptIds: departmentIds,
    //   })
    //   .andWhere('user.name LIKE :name', { name: `%${name}%` })
    //   .andWhere('user.username LIKE :username', { username: `%${username}%` })
    //   .andWhere('user.remark LIKE :remark', { remark: `%${remark}%` })
    //   .andWhere('user.phone LIKE :phone', { phone: `%${phone}%` })
    //   .orderBy('user.updated_at', 'DESC')
    //   .groupBy('user.id')
    //   .offset((page - 1) * limit)
    //   .limit(limit);
    // const [_, total] = await qb.getManyAndCount();
    // const list = await qb.getRawMany();
    // const dealResult: PageSearchUserInfo[] = list.map((n) => {
    //   const convertData = Object.entries<[string, any]>(n).map(
    //     ([key, value]) => [camelCase(key), value],
    //   );
    //   return {
    //     ...Object.fromEntries(convertData),
    //     departmentName: n.dept_name,
    //     roleNames: n.roleNames.split(','),
    //   };
    // });
    // return [dealResult, total];
    const queryAll: boolean = isEmpty(departmentIds);
    const rootUserId = await this.findRootUserId();
    const getQuery = (isAll, ids) => {
      if (isAll) {
        return '1 = 1';
      } else {
        return `user.department_id IN  (${ids.join(',')})`;
      }
    };
    const sql = `SELECT user.*, dept.name dept_name, role.name role_name FROM sys_user user INNER JOIN sys_dept dept ON dept.id = user.department_id INNER JOIN sys_user_role user_role ON user_role.user_id = user.id INNER JOIN sys_role role ON role.id = user_role.role_id  WHERE user.id NOT IN (${rootUserId}, ${uid}) and ${getQuery(
      queryAll,
      departmentIds,
    )} LIMIT ${(page - 1) * limit}, ${limit}`;
    const result: any = await prisma.$queryRawUnsafe(`${sql.toString()}`);
    const dealResult: PageSearchUserInfo[] = [];
    // 过滤去重
    result.forEach((e) => {
      const index = findIndex(dealResult, (e2) => e2.id === e.id);
      if (index < 0) {
        // 当前元素不存在则插入
        dealResult.push({
          createdAt: e.created_at,
          departmentId: e.department_id,
          email: e.email,
          headImg: e.head_img,
          id: e.id,
          name: e.name,
          nickName: e.nick_name,
          phone: e.phone,
          remark: e.remark,
          status: e.status,
          updatedAt: e.updated_at,
          username: e.username,
          departmentName: e.dept_name,
          roleNames: [e.role_name],
        });
      } else {
        // 已存在
        if (dealResult[index].roleNames.lastIndexOf(e.role_name) === -1) {
          dealResult[index].roleNames.push(e.role_name);
        }
      }
    });
    return dealResult;
  }

  /**
   * 禁用用户
   */
  async forbidden(uid: number): Promise<void> {
    await this.redisService.getRedis().del(`admin:passwordVersion:${uid}`);
    await this.redisService.getRedis().del(`admin:token:${uid}`);
    await this.redisService.getRedis().del(`admin:perms:${uid}`);
  }

  /**
   * 禁用多个用户
   */
  async multiForbidden(uids: number[]): Promise<void> {
    if (uids) {
      const pvs: string[] = [];
      const ts: string[] = [];
      const ps: string[] = [];
      uids.forEach((e) => {
        pvs.push(`admin:passwordVersion:${e}`);
        ts.push(`admin:token:${e}`);
        ps.push(`admin:perms:${e}`);
      });
      await this.redisService.getRedis().del(pvs);
      await this.redisService.getRedis().del(ts);
      await this.redisService.getRedis().del(ps);
    }
  }

  /**
   * 升级用户版本密码
   */
  async upgradePasswordV(id: number): Promise<void> {
    // admin:passwordVersion:${param.id}
    const v = await this.redisService.getRedis().get(`admin:passwordVersion:${id}`);
    if (!isEmpty(v)) {
      await this.redisService.getRedis().set(`admin:passwordVersion:${id}`, parseInt(v) + 1);
    }
  }
}
