import { Body, Controller, Get, Post, Query, Param, Put, Delete, UseInterceptors, Res, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Keep, RequiresPermissions } from 'src/common/decorators';
import { ExcelFileCleanupInterceptor } from 'src/common/interceptors/excel.interceptor';
import { Service } from './service';
import { keyStr, controllerName, ADMIN_PREFIX } from './config';

@ApiSecurity(ADMIN_PREFIX)
@ApiTags(`${keyStr}模块`)
@Controller(`${controllerName}`)
export class MyController {
  constructor(private service: Service) {}

  /**
   * 获取参数配置列表
   */
  @RequiresPermissions('system:config:list')
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
   * 导出
   */
  @RequiresPermissions('system:config:export')
  @ApiOperation({ summary: `导出` })
  @UseInterceptors(ExcelFileCleanupInterceptor)
  @Post('export')
  async export(@Body() dto: any, @Res() res: any): Promise<StreamableFile> {
    const { filename, filePath, file } =  await this.service.pageDtoExport(dto);
    res.filePathToDelete = filePath;
    res.header('Content-disposition', `attachment; filename=${filename}.xlsx`);
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(file);
  }

  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Get(':id')
  async info1(@Param() params: any): Promise<any> {
    const list = await this.service.info(params.id);
    return list;
  }

  /**
   * 新增参数配置
   */
  @RequiresPermissions('system:config:add')
  @ApiOperation({ summary: `新增${keyStr}` })
  @ApiOkResponse()
  @Post()
  async create(@Body() body: any): Promise<any> {
    const list = await this.service.create(body);
    return list;
  }

  /**
   * 修改参数配置
   */
  @RequiresPermissions('system:config:edit')
  @ApiOperation({ summary: `修改${keyStr}` })
  @ApiOkResponse()
  @Put()
  async update(@Body() body: any): Promise<any> {
    const list = await this.service.update(body);
    return list;
  }

  /**
   * 删除参数配置
   */
  @RequiresPermissions('system:config:remove')
  @ApiOperation({ summary: `删除${keyStr}` })
  @ApiOkResponse()
  @Delete(':id')
  async delete(@Param() params: any): Promise<any> {
    const list = await this.service.delete(params.id);
    return list;
  }
}
