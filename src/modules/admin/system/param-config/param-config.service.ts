import { Injectable } from '@nestjs/common';
import { ApiException } from 'src/common/exceptions/api.exception';
import { CreateParamConfigDto, UpdateParamConfigDto } from './param-config.dto';
import { prisma } from 'src/prisma';
import { sys_config } from '@prisma/client';

@Injectable()
export class SysParamConfigService {
  /**
   * 罗列所有配置
   */
  async getConfigListByPage(
    page: number,
    count: number,
  ): Promise<sys_config[]> {
    return await prisma.sys_config.findMany({
      take: count,
      skip: page * count,
      orderBy: {
        config_id: 'asc',
      },
    });
  }

  /**
   * 获取参数总数
   */
  async countConfigList(): Promise<number> {
    return await prisma.sys_config.count();
  }

  /**
   * 新增
   */
  async add(dto: CreateParamConfigDto): Promise<void> {
    await prisma.sys_config.create({
      data: dto,
    });
  }

  /**
   * 更新
   */
  async update(dto: UpdateParamConfigDto): Promise<void> {
    await prisma.sys_config.update({
      data: {
        config_name: dto.name,
        config_value: dto.value,
        remark: dto.remark,
      },
      where: {
        config_id: dto.id,
      },
    });
  }

  /**
   * 删除
   */
  async delete(ids: number[]): Promise<void> {
    await prisma.sys_config.deleteMany({
      where: {
        config_id: {
          in: ids,
        },
      },
    });
  }

  /**
   * 查询单个
   */
  async findOne(id: number): Promise<sys_config> {
    return await prisma.sys_config.findUnique({
      where: {
        config_id: id,
      },
    });
  }

  async isExistKey(key: string): Promise<void | never> {
    const result = await prisma.sys_config.findFirst({
      where: {
        config_key: key,
      },
    });
    if (result) {
      throw new ApiException(10021);
    }
  }

  async findValueByKey(key: string): Promise<string | null> {
    const result = await prisma.sys_config.findFirst({
      where: {
        config_key: key,
      },
      select: {
        config_value: true,
      },
    });
    if (result) {
      return result.config_value;
    }
    return null;
  }
}
