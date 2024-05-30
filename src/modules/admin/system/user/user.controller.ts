import { Body, Controller, Get, Post, Query, Param, Put, Delete, UseInterceptors, Res, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ADMIN_PREFIX } from '../../admin.constants';
import { IAdminUser } from '../../admin.interface';
import { AdminUser } from '../../core/decorators/admin-user.decorator';
import { SysMenuService } from '../menuBack/menu.service';
import { ExcelFileCleanupInterceptor } from 'src/common/interceptors/excel.interceptor';
import { CreateUserDto, DeleteUserDto, InfoUserDto, PageSearchUserDto, PasswordUserDto, UpdateUserDto } from './user.dto';
import { PageSearchUserInfo } from './user.class';
import { SysUserService } from './user.service';
import { Keep, RequiresPermissions } from 'src/common/decorators';

@ApiSecurity(ADMIN_PREFIX)
@ApiTags('管理员模块')
@Controller('user')
export class SysUserController {
  constructor(private userService: SysUserService, private menuService: SysMenuService) {}

  /**
   * 获取用户列表
   */
  @RequiresPermissions('system:user:list')
  @ApiOperation({ summary: `分页查询` })
  @Keep()
  @Get('list')
  async list(@Query() dto: any): Promise<any> {
    const rows = await this.userService.pageDto(dto);
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
   * 导出用户列表
   */
  @RequiresPermissions('system:user:export')
  @ApiOperation({ summary: `导出` })
  @UseInterceptors(ExcelFileCleanupInterceptor)
  @Post('export')
  async export(@Body() dto: any, @Res() res: any): Promise<StreamableFile> {
    const { filename, filePath, file } =  await this.userService.pageDtoExport(dto);
    res.filePathToDelete = filePath;
    res.header('Content-disposition', `attachment; filename=${filename}.xlsx`);
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(file);
  }

  /**
   * 重置密码
   */
  @RequiresPermissions('system:user:edit')
  @ApiOperation({ summary: '更改密码' })
  @Put('resetPwd')
  async resetPwd(@Body() dto: PasswordUserDto): Promise<void> {
    await this.userService.forceUpdatePassword(dto.userId, dto.password);
  }

  /**
   * 根据用户编号获取授权角色
   */
  @RequiresPermissions('system:user:query')
  @ApiOperation({ summary: `查询` })
  @Keep()
  @Get('authRole/:id')
  async authRoleById(@AdminUser() user: IAdminUser, @Param() params: any): Promise<any> {
    const list: any = await this.userService.infoUser0(params.id);
    const role = await this.userService.infoUserRole(params.id);
    list.roles = role;
    return {
      user: list,
      roles: role,
    };
  }

  /**
   * 用户授权角色
   */
  @RequiresPermissions('system:user:edit')
  @ApiOperation({ summary: `查询` })
  @Keep()
  @Put('authRole')
  async insertAuthRole(@Query() params: any): Promise<any> {
    const role = await this.userService.insertAuthRole(params.userId, params.roleIds);
    return {
      roles: role,
    };
  }

  /**
   * 获取部门树列表
   */
  @RequiresPermissions('system:user:list')
  @ApiOperation({ summary: '分页获取管理员列表' })
  @Keep()
  @Get('deptTree')
  async deptTree(@AdminUser() user: IAdminUser): Promise<any> {
    const res: any = await this.userService.deptTree();
    return res;
  }

  /**
   * 根据用户编号获取详细信息
   */
  @RequiresPermissions('system:user:query')
  @ApiOperation({ summary: `查询` })
  @ApiOkResponse()
  @Keep()
  @Get(':id')
  async infoUser(@Param() params: any): Promise<any> {
    if (params.id) {
      const list = await this.userService.infoUser(params.id);
      return list;
    } else {
      const list = await this.userService.infoUserV1();
      return list;
    }
  }

  /**
   * 新增用户
   */
  @RequiresPermissions('system:user:add')
  @ApiOperation({
    summary: '新增管理员',
  })
  @Post()
  async create(@Body() dto: any): Promise<void> {
    await this.userService.create(dto);
  }

  /**
   * 修改用户
   */
  @RequiresPermissions('system:user:edit')
  @ApiOperation({
    summary: '更新管理员信息',
  })
  @Put()
  async update(@Body() dto: any): Promise<void> {
    await this.userService.update(dto);
    await this.menuService.refreshPerms(dto.id);
  }

  /**
   * 删除用户
   */
  @RequiresPermissions('system:user:remove')
  @ApiOperation({ summary: `删除用户` })
  @ApiOkResponse()
  @Keep()
  @Delete(':ids')
  async remove(@Param() params: any): Promise<any> {
    return await this.userService.delete(params.ids);
  }

  // @ApiOperation({
  //   summary: '根据ID列表删除管理员',
  // })
  // @Post('delete')
  // async delete(@Body() dto: DeleteUserDto): Promise<void> {
  //   await this.userService.delete(dto.userIds);
  //   await this.userService.multiForbidden(dto.userIds);
  // }

  @ApiOperation({
    summary: '分页获取管理员列表',
  })
  @ApiOkResponse({ type: [PageSearchUserInfo] })
  @Post('page')
  async page(@Body() dto: PageSearchUserDto, @AdminUser() user: IAdminUser): Promise<any> {
    const res: any = await this.userService.page(user.uid, dto);
    // const total = await this.userService.count(user.uid, dto.departmentIds);
    return {
      list: res,
      pagination: {
        total: res.length,
        page: dto.page,
        size: dto.limit,
      },
    };
  }

  @ApiOperation({
    summary: '更改指定管理员密码',
  })
  @Post('password')
  async password(@Body() dto: PasswordUserDto): Promise<void> {
    await this.userService.forceUpdatePassword(dto.userId, dto.password);
  }
}
