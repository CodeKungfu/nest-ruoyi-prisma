import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isEmpty } from 'lodash';
import * as svgCaptcha from 'svg-captcha';
import { UtilService } from 'src/shared/services/util.service';
import { ApiException } from 'src/common/exceptions/api.exception';
import { RedisService } from 'src/shared/services/redis.service';
import { SysLogService } from '../system/log/log.service';
import { SysUserService } from '../system/user/user.service';
import { SysMenuService } from '../system/menu/menu.service';
import { ImageCaptchaDto } from './login.dto';
import { ImageCaptcha, PermMenuInfo } from './login.class';

@Injectable()
export class LoginService {
  constructor(
    private redisService: RedisService,
    private menuService: SysMenuService,
    private userService: SysUserService,
    private logService: SysLogService,
    private util: UtilService,
    private jwtService: JwtService,
  ) {}

  /**
   * 创建验证码并缓存加入redis缓存
   * @param captcha 验证码长宽
   * @returns svg & id obj
   */
  async createImageCaptcha(captcha: ImageCaptchaDto): Promise<ImageCaptcha> {
    const svg = svgCaptcha.create({
      size: 4,
      color: true,
      noise: 4,
      width: isEmpty(captcha.width) ? 100 : captcha.width,
      height: isEmpty(captcha.height) ? 50 : captcha.height,
      charPreset: '1234567890',
    });
    const result = {
      img: `data:image/svg+xml;base64,${Buffer.from(svg.data).toString(
        'base64',
      )}`,
      id: await this.util.generateUUID(), // this.utils.generateUUID()
    };
    // 5分钟过期时间
    await this.redisService
      .getRedis()
      .set(`admin:captcha:img:${result.id}`, svg.text, 'EX', 60 * 5);
    return result;
  }

  /**
   * 校验验证码
   */
  async checkImgCaptcha(id: string, code: string): Promise<void> {
    const result = await this.redisService
      .getRedis()
      .get(`admin:captcha:img:${id}`);
    if (isEmpty(result) || code.toLowerCase() !== result.toLowerCase()) {
      throw new ApiException(10002);
    }
    // 校验成功后移除验证码
    await this.redisService.getRedis().del(`admin:captcha:img:${id}`);
  }

  /**
   * 获取登录JWT
   * 返回null则账号密码有误，不存在该用户
   */
  async getLoginSign(
    username: string,
    password: string,
    ip: string,
    ua: string,
  ): Promise<string> {
    const user = await this.userService.findUserByUserName(username);
    if (isEmpty(user)) {
      throw new ApiException(10003);
    }
    const comparePassword = this.util.md5(`${password}${user.salt}`);
    if (user.password !== comparePassword) {
      throw new ApiException(10003);
    }
    const perms = await this.menuService.getPerms(Number(user.user_id));
    // TODO 系统管理员开放多点登录
    if (Number(user.user_id) === 1) {
      const oldToken = await this.getRedisTokenById(Number(user.user_id));
      if (oldToken) {
        this.logService.saveLoginLog(Number(user.user_id), ip, ua);
        return oldToken;
      }
    }
    const jwtSign = this.jwtService.sign(
      {
        uid: parseInt(user.user_id.toString()),
        pv: 1,
      },
      // {
      //   expiresIn: '24h',
      // },
    );
    await this.redisService
      .getRedis()
      .set(`admin:passwordVersion:${user.user_id}`, 1);
    // Token设置过期时间 24小时
    await this.redisService
      .getRedis()
      .set(`admin:token:${user.user_id}`, jwtSign, 'EX', 60 * 60 * 24);
    await this.redisService
      .getRedis()
      .set(`admin:perms:${user.user_id}`, JSON.stringify(perms));
    await this.logService.saveLoginLog(Number(user.user_id), ip, ua);
    return jwtSign;
  }

  /**
   * 清除登录状态信息
   */
  async clearLoginStatus(uid: number): Promise<void> {
    await this.userService.forbidden(uid);
  }

  async getRouters(uid: number): Promise<any> {
    const menus_1 = await this.menuService.getMenus(uid);
    const menus = [];
    menus_1.forEach((item) => {
      const temp = Object.assign({}, item, {
        menu_id: Number(item.menu_id),
        parent_id: Number(item.parent_id),
      });
      menus.push(temp);
    });
    console.log(menus);
    return [
      {
        name: 'System',
        path: '/system',
        hidden: false,
        redirect: 'noRedirect',
        component: 'Layout',
        alwaysShow: true,
        meta: {
          title: '系统管理',
          icon: 'system',
          noCache: false,
          link: null,
        },
        children: [
          {
            name: 'User',
            path: 'user',
            hidden: false,
            component: 'system/user/index',
            meta: {
              title: '用户管理',
              icon: 'user',
              noCache: false,
              link: null,
            },
          },
          {
            name: 'Role',
            path: 'role',
            hidden: false,
            component: 'system/role/index',
            meta: {
              title: '角色管理',
              icon: 'peoples',
              noCache: false,
              link: null,
            },
          },
          {
            name: 'Menu',
            path: 'menu',
            hidden: false,
            component: 'system/menu/index',
            meta: {
              title: '菜单管理',
              icon: 'tree-table',
              noCache: false,
              link: null,
            },
          },
          {
            name: 'Dept',
            path: 'dept',
            hidden: false,
            component: 'system/dept/index',
            meta: {
              title: '部门管理',
              icon: 'tree',
              noCache: false,
              link: null,
            },
          },
          {
            name: 'Post',
            path: 'post',
            hidden: false,
            component: 'system/post/index',
            meta: {
              title: '岗位管理',
              icon: 'post',
              noCache: false,
              link: null,
            },
          },
          {
            name: 'Dict',
            path: 'dict',
            hidden: false,
            component: 'system/dict/index',
            meta: {
              title: '字典管理',
              icon: 'dict',
              noCache: false,
              link: null,
            },
          },
          {
            name: 'Config',
            path: 'config',
            hidden: false,
            component: 'system/config/index',
            meta: {
              title: '参数设置',
              icon: 'edit',
              noCache: false,
              link: null,
            },
          },
          {
            name: 'Notice',
            path: 'notice',
            hidden: false,
            component: 'system/notice/index',
            meta: {
              title: '通知公告',
              icon: 'message',
              noCache: false,
              link: null,
            },
          },
          {
            name: 'Log',
            path: 'log',
            hidden: false,
            redirect: 'noRedirect',
            component: 'ParentView',
            alwaysShow: true,
            meta: {
              title: '日志管理',
              icon: 'log',
              noCache: false,
              link: null,
            },
            children: [
              {
                name: 'Operlog',
                path: 'operlog',
                hidden: false,
                component: 'monitor/operlog/index',
                meta: {
                  title: '操作日志',
                  icon: 'form',
                  noCache: false,
                  link: null,
                },
              },
              {
                name: 'Logininfor',
                path: 'logininfor',
                hidden: false,
                component: 'monitor/logininfor/index',
                meta: {
                  title: '登录日志',
                  icon: 'logininfor',
                  noCache: false,
                  link: null,
                },
              },
            ],
          },
        ],
      },
      {
        name: 'Monitor',
        path: '/monitor',
        hidden: false,
        redirect: 'noRedirect',
        component: 'Layout',
        alwaysShow: true,
        meta: {
          title: '系统监控',
          icon: 'monitor',
          noCache: false,
          link: null,
        },
        children: [
          {
            name: 'Online',
            path: 'online',
            hidden: false,
            component: 'monitor/online/index',
            meta: {
              title: '在线用户',
              icon: 'online',
              noCache: false,
              link: null,
            },
          },
          {
            name: 'Job',
            path: 'job',
            hidden: false,
            component: 'monitor/job/index',
            meta: {
              title: '定时任务',
              icon: 'job',
              noCache: false,
              link: null,
            },
          },
          {
            name: 'Druid',
            path: 'druid',
            hidden: false,
            component: 'monitor/druid/index',
            meta: {
              title: '数据监控',
              icon: 'druid',
              noCache: false,
              link: null,
            },
          },
          {
            name: 'Server',
            path: 'server',
            hidden: false,
            component: 'monitor/server/index',
            meta: {
              title: '服务监控',
              icon: 'server',
              noCache: false,
              link: null,
            },
          },
          {
            name: 'Cache',
            path: 'cache',
            hidden: false,
            component: 'monitor/cache/index',
            meta: {
              title: '缓存监控',
              icon: 'redis',
              noCache: false,
              link: null,
            },
          },
          {
            name: 'CacheList',
            path: 'cacheList',
            hidden: false,
            component: 'monitor/cache/list',
            meta: {
              title: '缓存列表',
              icon: 'redis-list',
              noCache: false,
              link: null,
            },
          },
        ],
      }
    ];
  }
  /**
   * 获取权限菜单
   */
  async getPermMenu(uid: number): Promise<PermMenuInfo> {
    const menus = await this.menuService.getMenus(uid);
    const perms = await this.menuService.getPerms(uid);
    return { menus, perms };
  }

  async getRedisPasswordVersionById(id: number): Promise<string> {
    return this.redisService.getRedis().get(`admin:passwordVersion:${id}`);
  }

  async getRedisTokenById(id: number): Promise<string> {
    return this.redisService.getRedis().get(`admin:token:${id}`);
  }

  async getRedisPermsById(id: number): Promise<string> {
    return this.redisService.getRedis().get(`admin:perms:${id}`);
  }
}
