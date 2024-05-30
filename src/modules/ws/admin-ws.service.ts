import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminWSGateway } from 'src/modules/ws/admin-ws.gateway';
import { RemoteSocket } from 'socket.io';
import { EVENT_UPDATE_MENU } from './ws.event';
import { prisma } from 'src/prisma';

@Injectable()
export class AdminWSService {
  constructor(
    private jwtService: JwtService,
    private adminWsGateWay: AdminWSGateway,
  ) {}

  /**
   * 获取当前在线用户
   */
  async getOnlineSockets() {
    const onlineSockets = await this.adminWsGateWay.socketServer.fetchSockets();
    return onlineSockets;
  }

  /**
   * 根据uid查找socketid
   */
  async findSocketIdByUid(
    uid: number,
  ): Promise<RemoteSocket<unknown, unknown>> {
    const onlineSockets = await this.getOnlineSockets();
    const socket = onlineSockets.find((socket) => {
      const token = socket.handshake.query?.token as string;
      const tokenUid = this.jwtService.verify(token).uid;
      return tokenUid === uid;
    });
    return socket;
  }

  /**
   * 根据uid数组过滤出socketid
   */
  async filterSocketIdByUidArr(
    uids: number[],
  ): Promise<RemoteSocket<unknown, unknown>[]> {
    const onlineSockets = await this.getOnlineSockets();
    const sockets = onlineSockets.filter((socket) => {
      const token = socket.handshake.query?.token as string;
      const tokenUid = this.jwtService.verify(token).uid;
      return uids.includes(tokenUid);
    });
    return sockets;
  }

  /**
   * 通知前端重新获取权限菜单
   * @param userIds
   * @constructor
   */
  async noticeUserToUpdateMenusByUserIds(uid: number | number[]) {
    const userIds = Array.isArray(uid) ? uid : [uid];
    const sockets = await this.filterSocketIdByUidArr(userIds);
    if (sockets) {
      // socket emit event
      this.adminWsGateWay.socketServer
        .to(sockets.map((n) => n.id))
        .emit(EVENT_UPDATE_MENU);
    }
  }

  /**
   * 通过menuIds通知用户更新权限菜单
   */
  async noticeUserToUpdateMenusByMenuIds(menuIds: number[]): Promise<void> {
    const roleMenus = await prisma.sys_role_menu.findMany({
      where: {
        menuId: {
          in: menuIds,
        },
      },
    });
    const roleIds = roleMenus.map((n) => Number(n.roleId));
    await this.noticeUserToUpdateMenusByRoleIds(roleIds);
  }

  /**
   * 通过roleIds通知用户更新权限菜单
   */
  async noticeUserToUpdateMenusByRoleIds(roleIds: number[]): Promise<void> {
    const users = await prisma.sys_user_role.findMany({
      where: {
        roleId: {
          in: roleIds,
        },
      },
    });
    if (users) {
      const userIds = users.map((n) => Number(n.roleId));
      await this.noticeUserToUpdateMenusByUserIds(userIds);
    }
  }
}
