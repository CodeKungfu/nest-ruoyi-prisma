import { ApiProperty } from '@nestjs/swagger';
import { sys_menu } from '@prisma/client';

export class ImageCaptcha {
  @ApiProperty({
    description: 'base64格式的svg图片',
  })
  img: string;

  @ApiProperty({
    description: '验证码对应的唯一ID',
  })
  id: string;
}

export class LoginToken {
  @ApiProperty({ description: 'JWT身份Token' })
  token: string;
}

export class PermMenuInfo {
  @ApiProperty({ description: '菜单列表', type: [] })
  menus: sys_menu[];

  @ApiProperty({ description: '权限列表', type: [String] })
  perms: string[];
}
