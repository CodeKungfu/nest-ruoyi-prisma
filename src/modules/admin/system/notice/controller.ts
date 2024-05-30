import { Body, Controller, Get, Post, Query, Param, Put, Delete } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Keep, RequiresPermissions } from 'src/common/decorators';
import { Service } from './service';
import { keyStr, controllerName, ADMIN_PREFIX } from './config';

@ApiSecurity(ADMIN_PREFIX)
@ApiTags(`${keyStr}模块`)
@Controller(`${controllerName}`)
export class MyController {
  constructor(private service: Service) {}

  /**
   * 获取通知公告列表
   */
  @RequiresPermissions('system:notice:list')
  @ApiOperation({ summary: `分页查询${keyStr}` })
  @Keep()
  @Get('list')
  async page(@Query() dto: any): Promise<any> {
    const rows = await this.service.pageDto(dto);
    return {
      rows: rows.result,
      total: rows.countNum,
      pagination: {
        size: dto.pageSize,
        page: dto.pageNum,
        total: rows.countNum,
      },
    };
  }

  /**
   * 根据通知公告编号获取详细信息
   */
  @RequiresPermissions('system:notice:query')
  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Get(':id')
  async info1(@Param() params: any): Promise<any> {
    const list = await this.service.info(params.id);
    return list;
  }

  /**
   * 新增通知公告
   */
  @RequiresPermissions('system:notice:add')
  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Post()
  async create(@Body() body: any): Promise<any> {
    const list = await this.service.create(body);
    return list;
  }

  /**
   * 修改通知公告
   */
  @RequiresPermissions('system:notice:edit')
  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Put()
  async update(@Body() body: any): Promise<any> {
    const list = await this.service.update(body);
    return list;
  }

  /**
   * 删除通知公告
   */
  @RequiresPermissions('system:notice:remove')
  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Delete(':id')
  async delete(@Param() params: any): Promise<any> {
    const list = await this.service.delete(params.id);
    return list;
  }
}
