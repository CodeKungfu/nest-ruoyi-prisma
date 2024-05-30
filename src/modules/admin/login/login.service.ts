import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isEmpty } from 'lodash';
import * as svgCaptcha from 'svg-captcha';
import { UtilService } from 'src/shared/services/util.service';
import { ApiException } from 'src/common/exceptions/api.exception';
import { RedisService } from 'src/shared/services/redis.service';
import { SysLogService } from '../system/log/log.service';
import { SysUserService } from '../system/user/user.service';
import { SysMenuService } from '../system/menuBack/menu.service';
import { ImageCaptchaDto } from './login.dto';
import { ImageCaptcha, PermMenuInfo } from './login.class';

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// console.log(capitalizeFirstLetter('nodejs')); // 输出: Nodejs

const transData = (jsonArr) => {
  const readArr = jsonArr;
  // 调用方法， temp为原始数据, result为树形结构数据
  const result = generateOptions(readArr);

  // 开始递归方法
  function generateOptions(params) {
    const result: any = [];
    for (const param of params) {
      if (Number(param.parent_id) === 0) {
        // 判断是否为顶层节点
        const parent: any = {
          name: capitalizeFirstLetter(param.path),
          path: '/' + param.path,
          hidden: false,
          redirect: 'noRedirect',
          component: 'Layout',
          alwaysShow: true,
          meta: {
            title: param.menu_name,
            icon: param.icon,
            noCache: false,
            link: null,
          },
        };
        parent.children = getchilds(param.menu_id, params); // 获取子节点
        result.push(parent);
      }
    }
    return result;
  }

  function getchilds(id, array) {
    const childs = [];
    for (const arr of array) {
      // 循环获取子节点
      if (arr.parent_id === id) {
        childs.push({
          name: capitalizeFirstLetter(arr.path),
          path: arr.path,
          hidden: false,
          component: arr.component,
          meta: {
            title: arr.menu_name,
            icon: arr.icon,
            noCache: false,
            link: null,
          },
        });
      }
    }
    for (const child of childs) {
      // 获取子节点的子节点
      const childscopy = getchilds(child.id, array); // 递归获取子节点
      if (childscopy.length > 0) {
        child.children = childscopy;
      }
    }
    return childs;
  }
  return result;
};

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
    const comparePassword = this.util.md5(`${password}`);
    if (user.password !== comparePassword) {
      throw new ApiException(10003);
    }
    const perms = await this.menuService.getPerms(Number(user.userId));
    // TODO 系统管理员开放多点登录
    if (Number(user.userId) === 1) {
      const oldToken = await this.getRedisTokenById(Number(user.userId));
      if (oldToken) {
        this.logService.saveLoginLog(Number(user.userId), ip, ua);
        return oldToken;
      }
    }
    const jwtSign = this.jwtService.sign(
      {
        uid: parseInt(user.userId.toString()),
        pv: 1,
      },
      // {
      //   expiresIn: '24h',
      // },
    );
    await this.redisService
      .getRedis()
      .set(`admin:passwordVersion:${user.userId}`, 1);
    // Token设置过期时间 24小时
    await this.redisService
      .getRedis()
      .set(`admin:token:${user.userId}`, jwtSign, 'EX', 60 * 60 * 24);
    await this.redisService
      .getRedis()
      .set(`admin:perms:${user.userId}`, JSON.stringify(perms));
    await this.logService.saveLoginLog(Number(user.userId), ip, ua);
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
    menus_1.forEach((item: any) => {
      const temp = Object.assign({}, item, {
        menuId: Number(item.menu_id),
        parentId: Number(item.parent_id),
      });
      menus.push(temp);
    });
    // console.log(menus);
    const res = transData(menus);
    // console.log(res);
    return res;
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
