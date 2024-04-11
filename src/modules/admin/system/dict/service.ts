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
   * 列举所有条数
   */
  async count(): Promise<number> {
    return await prisma[tableName].count();
  }

  /**
   * 根据获取信息
   */
  async info(id: string): Promise<tableType> {
    const resultInfo: tableType = await prisma[tableName].findUnique({
      where: {
        dictId: Number(id),
      },
    });
    if (isEmpty(resultInfo)) {
      throw new ApiException(10017);
    }

    return { ...resultInfo };
  }

  /**
   * 分页加载信息
   */
  async page(page: number, count: number): Promise<tableType[]> {
    const result: any = await prisma[tableName].findMany({
      skip: page * count,
      take: count,
    });
    return result;
  }
}
