import { Body, Controller, Get, Post, Query, Param, Delete, Put, UseInterceptors, Res, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Keep, RequiresPermissions } from 'src/common/decorators';
import { ExcelFileCleanupInterceptor } from 'src/common/interceptors/excel.interceptor';
import { Service } from './service';
import { PageDto$Dict } from './dto';
import { keyStr, controllerName, ADMIN_PREFIX } from './config';

@ApiSecurity(ADMIN_PREFIX)
@ApiTags(`${keyStr}模块`)
@Controller(`${controllerName}`)
export class MyController {
  constructor(private service: Service) {}

  @RequiresPermissions('system:dict:list')
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

  /**
   * 导出
   */
  @RequiresPermissions('system:dict:export')
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

  /**
   * 查询字典类型详细
   */
  @RequiresPermissions('system:dict:query')
  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Get(':id')
  async info(@Param() params: any): Promise<any> {
    const list = await this.service.info(params.id);
    return {
      ...list,
    };
  }

  /**
   * 新增字典类型
   */
  @RequiresPermissions('system:dict:add')
  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Post()
  async create(@Body() body: any): Promise<any> {
    const list = await this.service.create(body);
    return list;
  }

  /**
   * 修改字典类型
   */
  @RequiresPermissions('system:dict:edit')
  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Put()
  async update(@Body() body: any): Promise<any> {
    const list = await this.service.update(body);
    return list;
  }

  /**
   * 删除字典类型
   */
  @RequiresPermissions('system:dict:remove')
  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Delete(':id')
  async delete(@Param() params: any): Promise<any> {
    const list = await this.service.delete(params.id);
    return list;
  }

  /**
   * 获取字典选择框列表
   */
  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Get('optionselect')
  async optionselect(): Promise<any> {
    const list = await this.service.optionselect();
    return {
      ...list,
    };
  }
}
