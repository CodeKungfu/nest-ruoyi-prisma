import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): any {
    return {"msg":"操作成功","code":200,"captchaEnabled":false};
  }
}
