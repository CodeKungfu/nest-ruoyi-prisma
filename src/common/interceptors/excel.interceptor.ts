import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import * as fs from 'fs';

@Injectable()
export class ExcelFileCleanupInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    // nestjs의 생명 주기에서 request가 아닌 response에 대해서만 동작하게
    const response = context.switchToHttp().getResponse();

    // const responseFinished = new Promise<void>((resolve) => {
    //   response.once('finish', resolve);
    // });

    return next.handle().pipe(
      tap(async () => {
        // 위 responseFinished를 통해 controller의 return이 된 후 동작하게 만든다.
        // await responseFinished;

        const filePath = response?.filePathToDelete;

        if (filePath) {
          try {
            // fs.unlinkSync를 통해 해당 위치의 파일 제거
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error('Error deleting file:', err);
          }
        }
      }),
    );
  }
}
