import { Body, Controller, Get, Post, Query, Param, Put, Delete, Res, UseInterceptors, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ADMIN_PREFIX } from 'src/modules/admin/admin.constants';
import { ApiException } from 'src/common/exceptions/api.exception';
import { AdminUser } from '../../core/decorators/admin-user.decorator';
import { IAdminUser } from '../../admin.interface';
import { SysMenuService } from '../menuBack/menu.service';
import { RoleInfo } from './role.class';
import { CreateRoleDto, DeleteRoleDto, InfoRoleDto, UpdateRoleDto } from './role.dto';
import { SysRoleService } from './role.service';
import { Keep, RequiresPermissions } from 'src/common/decorators';
import { ExcelFileCleanupInterceptor } from 'src/common/interceptors/excel.interceptor';

@ApiSecurity(ADMIN_PREFIX)
@ApiTags('角色模块')
@Controller('role')
export class SysRoleController {
  constructor(private roleService: SysRoleService, private menuService: SysMenuService) {}

  @RequiresPermissions('system:role:list')
  @ApiOperation({ summary: '获取角色列表' })
  @ApiOkResponse()
  @Keep()
  @Get('list')
  async list(): Promise<any> {
    const rows = await this.roleService.list();
    return {
      rows,
    };
  }

  /**
   * 导出用户列表
   */
  @RequiresPermissions('system:role:export')
  @ApiOperation({ summary: `导出` })
  @UseInterceptors(ExcelFileCleanupInterceptor)
  @Post('export')
  async export(@Body() dto: any, @Res() res: any): Promise<StreamableFile> {
    const { filename, filePath, file } =  await this.roleService.pageDtoExport(dto);
    res.filePathToDelete = filePath;
    res.header('Content-disposition', `attachment; filename=${filename}.xlsx`);
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(file);
  }

  /**
   * 根据角色编号获取详细信息
   */
  @RequiresPermissions('system:role:query')
  @ApiOperation({ summary: `获取角色信息` })
  @ApiOkResponse()
  @Get(':id')
  async info1(@Param() params: any): Promise<any> {
    const list = await this.roleService.detailInfo(params.id);
    return list;
  }

  /**
   * 新增角色
   */
  @RequiresPermissions('system:role:add')
  @ApiOperation({ summary: '新增角色' })
  @Post()
  async add(@Body() dto: any, @AdminUser() user: IAdminUser): Promise<void> {
    await this.roleService.add(dto, user.uid);
  }

  /**
   * 修改保存角色
   */
  @RequiresPermissions('system:role:edit')
  @ApiOperation({ summary: `获取角色信息` })
  @ApiOkResponse()
  @Put()
  async updateV1(@Body() body: any): Promise<any> {
    const list = await this.roleService.updateV1(body);
    return list;
  }

  /**
   * 删除角色
   */
  @RequiresPermissions('system:role:remove')
  @ApiOperation({ summary: `获取角色信息` })
  @ApiOkResponse()
  @Delete(':ids')
  async remove(@Param() params: any): Promise<any> {
    const list = await this.roleService.delete(params);
    return list;
  }

  /**
   * 修改保存数据权限
   */
  @RequiresPermissions('system:role:edit')
  @ApiOperation({ summary: `获取角色信息` })
  @ApiOkResponse()
  @Put('dataScope')
  async updateV2(@Body() body: any): Promise<any> {
    const list = await this.roleService.updateV2(body);
    return list;
  }

  /**
   * 查询已分配用户角色列表
   */
  @RequiresPermissions('system:role:list')
  @ApiOperation({ summary: `获取角色信息` })
  @Keep()
  @Get('authUser/allocatedList')
  async allocatedList(@Query() dto: any): Promise<any> {
    const rows = await this.roleService.pageDto(dto);
    return {
      rows: rows.user,
      total: rows.countNum,
      pagination: {
        size: dto.pageSize,
        page: dto.pageNum,
        total: rows.countNum,
      },
    };
  }

  /**
   * 查询未分配用户角色列表
   */
  @RequiresPermissions('system:role:list')
  @ApiOperation({ summary: `获取角色信息` })
  @Keep()
  @Get('authUser/unallocatedList')
  async unallocatedList(@Query() dto: any): Promise<any> {
    const rows = await this.roleService.pageDto1(dto);
    return {
      rows: rows.user,
      total: rows.countNum,
      pagination: {
        size: dto.pageSize,
        page: dto.pageNum,
        total: rows.countNum,
      },
    };
  }

  /**
   * 取消授权用户
   */
  @RequiresPermissions('system:role:edit')
  @ApiOperation({ summary: `取消授权用户` })
  @Keep()
  @Put('authUser/cancel')
  async cancelAuthUser(@Body() body: any): Promise<any> {
    const rows = await this.roleService.cancelAuthUser(body);
    return rows;
  }

  /**
   * 批量取消授权用户
   */
  @RequiresPermissions('system:role:edit')
  @ApiOperation({ summary: `批量取消授权用户` })
  @Keep()
  @Put('authUser/cancelAll')
  async cancelAuthUserAll(@Query() body: any): Promise<any> {
    const rows = await this.roleService.cancelAuthUserAll(body);
    return rows;
  }

  /**
   * 批量选择用户授权
   */
  @RequiresPermissions('system:role:edit')
  @ApiOperation({ summary: `批量选择用户授权` })
  @Put('authUser/selectAll')
  async selectAll(@Query() dto: any): Promise<any> {
    const rows = await this.roleService.insertAuthUsers(dto);
    return rows;
  }

  /**
   * 获取对应角色部门树列表
   */
  @RequiresPermissions('system:role:query')
  @ApiOperation({ summary: `获取角色信息` })
  @Keep()
  @Get('deptTree/:id')
  async deptTree(@Param() params: any): Promise<any> {
    const rows = await this.roleService.deptTree(params.id);
    return rows;
  }

  @ApiOperation({ summary: '更新角色' })
  @Post('update')
  async update(@Body() dto: UpdateRoleDto): Promise<void> {
    await this.roleService.update(dto);
    await this.menuService.refreshOnlineUserPerms();
  }

  @ApiOperation({ summary: '分页查询角色信息' })
  @ApiOkResponse()
  @Get('page')
  async page(@Query() dto: any): Promise<any> {
    const list = await this.roleService.page({
      page: dto.page - 1,
      limit: Number(dto.limit),
      name: dto.name,
    });
    const count = await this.roleService.count();
    return {
      list,
      pagination: {
        size: dto.limit,
        page: dto.page,
        total: count,
      },
    };
  }

  @ApiOperation({ summary: '删除角色' })
  @Post('delete')
  async delete(@Body() dto: DeleteRoleDto): Promise<void> {
    const count = await this.roleService.countUserIdByRole(dto.roleIds);
    if (count > 0) {
      throw new ApiException(10008);
    }
    await this.roleService.delete(dto.roleIds);
    await this.menuService.refreshOnlineUserPerms();
  }

  @ApiOperation({ summary: '获取角色信息' })
  @ApiOkResponse({ type: RoleInfo })
  @Get('info')
  async info(@Query() dto: InfoRoleDto): Promise<RoleInfo> {
    return await this.roleService.info(dto.roleId);
  }
}
