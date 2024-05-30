import { Inject, Injectable } from '@nestjs/common';
import { ApiException } from 'src/common/exceptions/api.exception';
import { difference, filter, includes, isEmpty, map, findIndex, omit } from 'lodash';
import { prisma } from 'src/prisma';
import { ExcelService } from 'src/shared/services/excel.service';
import { tableType, tableName } from './config';

@Injectable()
export class Service {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(private excelService: ExcelService) {}

  /**
   * 根据获取信息
   */
  async info(type: string): Promise<tableType[]> {
    const resultInfo: tableType[] = await prisma[tableName].findMany({
      where: {
        dictType: type,
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
  async info1(id: number): Promise<tableType> {
    const resultInfo: tableType = await prisma[tableName].findFirst({
      where: {
        dictCode: id,
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
        dictCode: id,
      },
    });
    return resultInfo;
  }

  /**
   * 更新信息
   */
  async update(body: any): Promise<tableType> {
    const updateObj = omit(body, ['dictCode', 'createTime']);
    const resultInfo: tableType = await prisma[tableName].update({
      data: updateObj,
      where: {
        dictCode: body.dictCode,
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

  /**
   * 导出
   */
  async pageDtoExport(dto: any) {
    const queryObj = omit(dto, ['pageNum', 'pageSize']);
    const result: any = await prisma[tableName].findMany({
      skip: (Number(dto.pageNum) - 1) * Number(dto.pageSize),
      take: Number(dto.pageSize),
      where: queryObj,
    });
    
    return this.excelService.createExcelFile('target', result);
  }
}
