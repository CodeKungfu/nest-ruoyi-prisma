import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOkResponse()
  @Get('list')
  async page(@Query() dto: PageDto$Dict): Promise<any> {
    const rows = await this.service.page(dto.pageNum - 1, dto.pageSize);
    const count = await this.service.count();
    return {
      rows,
      pagination: {
        size: dto.pageSize,
        page: dto.pageNum,
        total: count,
      },
    };
  }
  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Get('info')
  async info(@Query() dto: InfoDto$Dict): Promise<any> {
    const list = await this.service.info(dto.id);
    return {
      ...list,
    };
  }
}
