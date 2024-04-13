import { Inject, Injectable } from '@nestjs/common';
// import { camelCase, isEmpty } from 'lodash';
import { findIndex, isEmpty } from 'lodash';
import { ApiException } from 'src/common/exceptions/api.exception';
import { UtilService } from 'src/shared/services/util.service';
import { ROOT_ROLE_ID } from 'src/modules/admin/admin.constants';
import { RedisService } from 'src/shared/services/redis.service';
import { SYS_USER_INITPASSWORD } from 'src/common/contants/param-config.contants';
// import { SysParamConfigService } from '../param-config/param-config.service';
import { AccountInfo, PageSearchUserInfo } from './user.class';
import {
  CreateUserDto,
  PageSearchUserDto,
  UpdatePasswordDto,
  UpdateUserDto,
  UpdateUserInfoDto,
} from './user.dto';
import { prisma } from 'src/prisma';
import { sys_user } from '@prisma/client';

@Injectable()
export class SysUserService {
  constructor(
    private redisService: RedisService,
    // private paramConfigService: SysParamConfigService,
    @Inject(ROOT_ROLE_ID) private rootRoleId: number,
    private util: UtilService,
  ) {}

  /**
   * 根据用户名查找已经启用的用户
   */
  async findUserByUserName(username: string): Promise<sys_user | undefined> {
    return await prisma.sys_user.findFirst({
      where: {
        login_name: username,
        status: '1',
      },
    });
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
        user_id: uid,
      },
    });
    if (isEmpty(user)) {
      throw new ApiException(10017);
    }
    return {
      name: user.user_name,
      nickName: user.user_name,
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
    const user: sys_user = await prisma.sys_user.findUnique({
      where: {
        user_id: uid,
      },
    });
    if (isEmpty(user)) {
      throw new ApiException(10017);
    }
    return {
      permissions: ['*:*:*'],
      roles: ['admin'],
      user: {
        name: user.user_name,
        nickName: user.user_name,
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
        user_id: uid,
      },
    });
  }

  /**
   * 更改管理员密码
   */
  async updatePassword(uid: number, dto: UpdatePasswordDto): Promise<void> {
    const user = await prisma.sys_user.findUnique({
      where: {
        user_id: uid,
      },
    });
    if (isEmpty(user)) {
      throw new ApiException(10017);
    }
    const comparePassword = this.util.md5(`${dto.originPassword}${user.salt}`);
    // 原密码不一致，不允许更改
    if (user.password !== comparePassword) {
      throw new ApiException(10011);
    }
    const password = this.util.md5(`${dto.newPassword}${user.salt}`);
    await prisma.sys_user.update({
      data: { password },
      where: {
        user_id: uid,
      },
    });
    await this.upgradePasswordV(Number(user.user_id));
  }

  /**
   * 直接更改管理员密码
   */
  async forceUpdatePassword(uid: number, password: string): Promise<void> {
    const user = await prisma.sys_user.findUnique({
      where: {
        user_id: uid,
      },
    });
    if (isEmpty(user)) {
      throw new ApiException(10017);
    }
    const newPassword = this.util.md5(`${password}${user.salt}`);
    await prisma.sys_user.update({
      data: { password: newPassword },
      where: {
        user_id: uid,
      },
    });
    await this.upgradePasswordV(Number(user.user_id));
  }

  /**
   * 增加系统用户，如果返回false则表示已存在该用户
   * @param param Object 对应SysUser实体类
   */
  async add(param: CreateUserDto): Promise<void> {
    // const insertData: any = { ...CreateUserDto };
    const exists = await prisma.sys_user.findFirst({
      where: {
        user_name: param.username,
      },
    });
    if (!isEmpty(exists)) {
      throw new ApiException(10001);
    }
    // 所有用户初始密码为123456
    await prisma.$transaction(async (prisma) => {
      const salt = await this.util.generateRandomValue(32);
      // 查找配置的初始密码
      // const initPassword = await this.paramConfigService.findValueByKey(
      //   SYS_USER_INITPASSWORD,
      // );
      const initPassword = '';
      const password = this.util.md5(`${initPassword ?? '123456'}${salt}`);
      const result = await prisma.sys_user.create({
        data: {
          dept_id: param.departmentId,
          user_name: param.username,
          password,
          // login_name: param.name,
          login_name: param.nickName,
          email: param.email,
          phonenumber: param.phone,
          remark: param.remark,
          status: param.status.toString(),
          salt: salt,
        },
      });
      const { roles } = param;
      const insertRoles = roles.map((e) => {
        return {
          role_id: e,
          user_id: result.user_id,
        };
      });
      // 分配角色
      await prisma.sys_user_role.createMany({
        data: insertRoles,
      });
    });
  }

  /**
   * 更新用户信息
   */
  async update(param: UpdateUserDto): Promise<void> {
    await prisma.$transaction(async (prisma) => {
      await prisma.sys_user.update({
        data: {
          dept_id: param.departmentId,
          user_name: param.username,
          // name: param.name,
          login_name: param.nickName,
          email: param.email,
          phonenumber: param.phone,
          remark: param.remark,
          status: param.status.toString(),
        },
        where: {
          user_id: param.id,
        },
      });
      // 先删除原来的角色关系
      await prisma.sys_user_role.deleteMany({
        where: {
          user_id: param.id,
        },
      });
      const insertRoles = param.roles.map((e) => {
        return {
          role_id: e,
          user_id: param.id,
        };
      });
      await prisma.sys_user_role.createMany({
        data: insertRoles,
      });
      if (param.status === 0) {
        // 禁用状态
        await this.forbidden(param.id);
      }
    });
  }

  /**
   * 查找用户信息
   * @param id 用户id
   */
  async info(
    id: number,
  ): Promise<sys_user & { roles: bigint[]; departmentName: string }> {
    const user: sys_user = await prisma.sys_user.findUnique({
      where: {
        user_id: id,
      },
    });
    if (isEmpty(user)) {
      throw new ApiException(10017);
    }
    const departmentRow = await prisma.sys_dept.findUnique({
      where: {
        dept_id: user.dept_id,
      },
    });
    if (isEmpty(departmentRow)) {
      throw new ApiException(10018);
    }
    const roleRows = await prisma.sys_user_role.findMany({
      where: {
        user_id: user.user_id,
      },
    });
    const roles = roleRows.map((e) => {
      return e.role_id;
    });
    delete user.password;
    return { ...user, roles, departmentName: departmentRow.dept_name };
  }

  /**
   * 查找列表里的信息
   */
  async infoList(ids: number[]): Promise<sys_user[]> {
    const users = await prisma.sys_user.findMany({
      where: {
        user_id: {
          in: ids,
        },
      },
    });
    return users;
  }

  /**
   * 根据ID列表删除用户
   */
  async delete(userIds: number[]): Promise<void | never> {
    const rootUserId = await this.findRootUserId();
    if (userIds.includes(Number(rootUserId))) {
      throw new Error('can not delete root user!');
    }
    await prisma.sys_user.deleteMany({
      where: {
        user_id: {
          in: userIds,
        },
      },
    });
    await prisma.sys_user_role.deleteMany({
      where: {
        user_id: {
          in: userIds,
        },
      },
    });
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
          user_id: {
            notIn: [Number(rootUserId), uid],
          },
        },
      });
    }
    return await prisma.sys_user.count({
      where: {
        user_id: {
          notIn: [Number(rootUserId), uid],
        },
        dept_id: {
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
        role_id: this.rootRoleId,
      },
    });
    return result[0].user_id;
  }

  /**
   * 根据部门ID进行分页查询用户列表
   * deptId = -1 时查询全部
   */
  async page(
    uid: number,
    params: PageSearchUserDto,
  ): Promise<PageSearchUserInfo[]> {
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
    const v = await this.redisService
      .getRedis()
      .get(`admin:passwordVersion:${id}`);
    if (!isEmpty(v)) {
      await this.redisService
        .getRedis()
        .set(`admin:passwordVersion:${id}`, parseInt(v) + 1);
    }
  }
}
