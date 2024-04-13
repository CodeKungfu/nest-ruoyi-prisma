import { Body, Controller, Get, Post, Query, Param, Put } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Keep } from 'src/common/decorators/keep.decorator';
import { ADMIN_PREFIX } from 'src/modules/admin/admin.constants';
import { Service } from './service';
import { PageDto$Dict, InfoDto$Dict } from './dto';
import { keyStr, controllerName } from './config';

@ApiSecurity(ADMIN_PREFIX)
@ApiTags(`${keyStr}模块`)
@Controller(`${controllerName}`)
export class MyController {
  constructor(private service: Service) {}

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
  @Get(':type/:name')
  async info(@Param() params: any): Promise<any> {
    const list = await this.service.info(params.name);
    return list;
  }

  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Get(':id')
  async info1(@Param() params: any): Promise<any> {
    const list = await this.service.info1(params.id);
    return list;
  }

  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Put()
  async update(@Body() body: any): Promise<any> {
    const list = await this.service.update(body);
    return list;
  }
}