import { ApiProperty } from '@nestjs/swagger';
// import { sys_user } from '@prisma/client';

export class AccountInfo {
  @ApiProperty()
  name: string;

  @ApiProperty()
  nickName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  remark: string;

  @ApiProperty()
  headImg: string;

  @ApiProperty()
  loginIp: string;
}

export class PageSearchUserInfo {
  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  departmentId: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  headImg: string;

  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  nickName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  remark: string;

  @ApiProperty()
  status: number;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  departmentName: string;

  @ApiProperty({
    type: [String],
  })
  roleNames: string[];
}

// export class UserDetailInfo extends sys_user {
//   @ApiProperty({
//     description: '关联角色',
//   })
//   roles: number[];

//   @ApiProperty({
//     description: '关联部门名称',
//   })
//   departmentName: string;
// }
