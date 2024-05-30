import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiException } from 'src/common/exceptions/api.exception';
import { AdminWSService } from 'src/modules/ws/admin-ws.service';
import { AdminWSGateway } from 'src/modules/ws/admin-ws.gateway';
import { EVENT_KICK } from 'src/modules/ws/ws.event';
import { UAParser } from 'ua-parser-js';
import { SysUserService } from '../user/user.service';
import { OnlineUserInfo } from './online.class';
import { prisma } from 'src/prisma';

@Injectable()
export class SysOnlineService {
  constructor(
    private userService: SysUserService,
    private adminWsGateWay: AdminWSGateway,
    private adminWSService: AdminWSService,
    private jwtService: JwtService,
  ) {}

  /**
   * 罗列在线用户列表
   */
  async listOnlineUser(currentUid: number): Promise<OnlineUserInfo[]> {
    const onlineSockets = await this.adminWSService.getOnlineSockets();
    if (!onlineSockets || onlineSockets.length <= 0) {
      return [];
    }
    const onlineIds = onlineSockets.map((socket) => {
      const token = socket.handshake.query?.token as string;
      return this.jwtService.verify(token).uid;
    });
    return await this.findLastLoginInfoList(onlineIds, currentUid);
  }

  /**
   * 下线当前用户
   */
  async kickUser(uid: number, currentUid: number): Promise<void> {
    const rootUserId = await this.userService.findRootUserId();
    const currentUserInfo = await this.userService.getAccountInfo(currentUid);
    if (uid === Number(rootUserId)) {
      throw new ApiException(10013);
    }
    // reset redis keys
    await this.userService.forbidden(uid);
    // socket emit
    const socket = await this.adminWSService.findSocketIdByUid(uid);
    if (socket) {
      // socket emit event
      this.adminWsGateWay.socketServer
        .to(socket.id)
        .emit(EVENT_KICK, { operater: currentUserInfo.name });
      // close socket
      socket.disconnect();
    }
  }

  /**
   * 根据用户id列表查找最近登录信息和用户信息
   */
  async findLastLoginInfoList(
    ids: number[],
    currentUid: number,
  ): Promise<OnlineUserInfo[]> {
    const rootUserId = await this.userService.findRootUserId();
    const result: any =
      await prisma.$queryRaw`SELECT sys_logininfor.created_at, sys_logininfor.ip, sys_logininfor.ua, sys_user.id, sys_user.username, sys_user.name
    FROM sys_logininfor 
    INNER JOIN sys_user ON sys_logininfor.user_id = sys_user.id 
    WHERE sys_logininfor.created_at IN (SELECT MAX(created_at) as createdAt FROM sys_logininfor GROUP BY user_id)
      AND sys_user.id IN (${ids.join(',')})`;
    if (result) {
      const parser = new UAParser();
      return result.map((e) => {
        const u = parser.setUA(e.ua).getResult();
        return {
          id: e.id,
          ip: e.ip,
          username: `${e.name}（${e.username}）`,
          isCurrent: currentUid === e.id,
          time: e.created_at,
          os: `${u.os.name} ${u.os.version}`,
          browser: `${u.browser.name} ${u.browser.version}`,
          disable: currentUid === e.id || e.id === rootUserId,
        };
      });
    }
    return [];
  }
}
