import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ADMIN_PREFIX } from 'src/modules/admin/admin.constants';
// import { PageOptionsDto } from 'src/common/dto/page.dto';
// import { PaginatedResponseDto } from 'src/common/class/res.class';
import { sys_role } from '@prisma/client';
import { ApiException } from 'src/common/exceptions/api.exception';
import { AdminUser } from '../../core/decorators/admin-user.decorator';
import { IAdminUser } from '../../admin.interface';
import { SysMenuService } from '../menu/menu.service';
import { RoleInfo } from './role.class';
import {
  CreateRoleDto,
  DeleteRoleDto,
  InfoRoleDto,
  UpdateRoleDto,
} from './role.dto';
import { SysRoleService } from './role.service';

@ApiSecurity(ADMIN_PREFIX)
@ApiTags('角色模块')
@Controller('role')
export class SysRoleController {
  constructor(
    private roleService: SysRoleService,
    private menuService: SysMenuService,
  ) {}

  @ApiOperation({ summary: '获取角色列表' })
  @ApiOkResponse()
  @Get('list')
  async list(): Promise<sys_role[]> {
    return await this.roleService.list();
  }

  @ApiOperation({ summary: '分页查询角色信息' })
  @ApiOkResponse()
  @Get('page')
  async page(@Query() dto: any): Promise<any> {
    // const [list, total] = await this.roleService.page(dto);
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

  @ApiOperation({ summary: '新增角色' })
  @Post('add')
  async add(
    @Body() dto: CreateRoleDto,
    @AdminUser() user: IAdminUser,
  ): Promise<void> {
    await this.roleService.add(dto, user.uid);
  }

  @ApiOperation({ summary: '更新角色' })
  @Post('update')
  async update(@Body() dto: UpdateRoleDto): Promise<void> {
    await this.roleService.update(dto);
    await this.menuService.refreshOnlineUserPerms();
  }

  @ApiOperation({ summary: '获取角色信息' })
  @ApiOkResponse({ type: RoleInfo })
  @Get('info')
  async info(@Query() dto: InfoRoleDto): Promise<RoleInfo> {
    return await this.roleService.info(dto.roleId);
  }
}
