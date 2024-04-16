import { Inject, Injectable } from '@nestjs/common';
import { ApiException } from 'src/common/exceptions/api.exception';
import {
  difference,
  filter,
  includes,
  isEmpty,
  map,
  findIndex,
  omit,
} from 'lodash';
import { prisma } from 'src/prisma';
import { tableType, tableName } from './config';

@Injectable()
export class Service {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

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
        deptId: {
          not: id,
        },
      },
    });
  }

  /**
   * 根据获取信息
   */
  async info(id: number): Promise<tableType> {
    const resultInfo: tableType = await prisma[tableName].findFirst({
      where: {
        deptId: Number(id),
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
        deptId: Number(id),
      },
    });
    return resultInfo;
  }

  /**
   * 更新信息
   */
  async update(body: any): Promise<tableType> {
    const updateObj = omit(body, ['deptId', 'createTime']);
    const resultInfo: tableType = await prisma[tableName].update({
      data: updateObj,
      where: {
        deptId: body.deptId,
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
