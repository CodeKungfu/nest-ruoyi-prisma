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

  @RequiresPermissions("system:logininfor:list")
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

  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Get(':id')
  async info1(@Param() params: any): Promise<any> {
    const list = await this.service.info(params.id);
    return list;
  }

  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Delete(':id')
  async delete(@Param() params: any): Promise<any> {
    const list = await this.service.delete(params.id);
    return list;
  }

  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Put()
  async update(@Body() body: any): Promise<any> {
    const list = await this.service.update(body);
    return list;
  }

  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Post()
  async create(@Body() body: any): Promise<any> {
    const list = await this.service.create(body);
    return list;
  }
}
