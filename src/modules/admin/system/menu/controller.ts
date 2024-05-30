import { Body, Controller, Get, Post, Query, Param, Put, Delete } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Keep, RequiresPermissions } from 'src/common/decorators';
import { AdminUser } from '../../core/decorators/admin-user.decorator';
import { Service } from './service';
import { keyStr, controllerName, ADMIN_PREFIX } from './config';

@ApiSecurity(ADMIN_PREFIX)
@ApiTags(`${keyStr}模块`)
@Controller(`${controllerName}`)
export class MyController {
  constructor(
    private service: Service
  ) {}

  /**
   * 获取菜单列表
   */
  @RequiresPermissions('system:menu:list')
  @ApiOperation({ summary: `分页查询${keyStr}` })
  @Keep()
  @Get('list')
  async list(): Promise<any> {
    const rows = await this.service.list();
    return {
      data: rows,
    };
  }

  /**
   * 根据菜单编号获取详细信息
   */
  @RequiresPermissions('system:menu:query')
  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Get(':id')
  async info1(@Param() params: any): Promise<any> {
    const list = await this.service.info(params.id);
    return list;
  }

  /**
   * 获取菜单下拉树列表
   */
  @ApiOperation({ summary: `查询${keyStr}` })
  @Keep()
  @Get('treeselect')
  async treeselect(@AdminUser() user: any,@Param() params: any): Promise<any> {
    const list = await this.service.treeselect(user.uid, params.id);
    return {data: list};
  }

  /**
   * 加载对应角色菜单列表树
   */
  @ApiOperation({ summary: `分页查询${keyStr}` })
  @Keep()
  @Get('roleMenuTreeselect/:id')
  async roleMenuTreeselect(@Param() params: any): Promise<any> {
    const rows = await this.service.roleMenuTreeselect(params.id);
    return {
      checkedKeys: rows.keys,
      menus: rows.menus,
    };
  }

  /**
   * 新增菜单
   */
  @RequiresPermissions('system:menu:add')
  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Post()
  async create(@Body() body: any): Promise<any> {
    const list = await this.service.create(body);
    return list;
  }

  /**
   * 修改菜单
   */
  @RequiresPermissions('system:menu:edit')
  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Put()
  async update(@Body() body: any): Promise<any> {
    const list = await this.service.update(body);
    return list;
  }

  /**
   * 删除菜单
   */
  @RequiresPermissions('system:menu:remove')
  @ApiOperation({ summary: `查询${keyStr}` })
  @ApiOkResponse()
  @Delete(':id')
  async delete(@Param() params: any): Promise<any> {
    const list = await this.service.delete(params.id);
    return list;
  }

  @ApiOperation({ summary: `分页查询${keyStr}` })
  @Keep()
  @Get('list/exclude/:id')
  async exclude(@Param() params: any): Promise<any> {
    const rows = await this.service.exclude(params.id);
    return {
      data: rows,
    };
  }

  @ApiOperation({ summary: `分页查询${keyStr}` })
  @Keep()
  @Get('page')
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
}
